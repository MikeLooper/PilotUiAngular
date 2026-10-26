import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ResourceVmRegistryService } from '../../services/vm/resource-vm-registry.service';
import {
  ResourceCrudViewModel,
  ResourceCrudVmFacade,
  ResourceDetailSection,
  SystemVmFacade,
  SystemVmState,
} from '../../services/vm/resource-vm.models';
import { ResourcePageComponent } from './resource-page';

type CrudFacadeDouble = Omit<ResourceCrudVmFacade, 'vm'> & {
  readonly vm: WritableSignal<ResourceCrudViewModel>;
};
type SystemFacadeDouble = Omit<SystemVmFacade, 'vm'> & {
  readonly vm: WritableSignal<SystemVmState>;
};

const ROUTES: Routes = [
  ...['categories', 'orders', 'order-details', 'system', 'bogus'].map((resourceKey) => ({
    path: `resources/${resourceKey}`,
    component: ResourcePageComponent,
    data: { resourceKey },
  })),
  { path: 'resources/numeric', component: ResourcePageComponent, data: { resourceKey: 42 } },
  { path: 'resources/no-key', component: ResourcePageComponent },
];

const IDLE_VM: ResourceCrudViewModel = {
  items: [],
  pagedItems: [],
  searchTerm: '',
  page: 1,
  pageSize: 8,
  totalItems: 0,
  totalPages: 1,
  sortDirection: 'asc',
  selectedItem: null,
  mutationResult: null,
  isLoading: false,
  errorMessage: null,
  hasEmptyState: false,
};

const IDLE_SYSTEM_VM: SystemVmState = {
  isLoading: false,
  healthcheckResult: null,
  aboutResult: null,
  errorMessage: null,
};

const DETAIL_SECTIONS: readonly ResourceDetailSection[] = [
  { title: 'Profile', kind: 'fields', fields: [{ label: 'Name', value: 'Chai' }] },
  { title: 'Metrics', kind: 'table', table: { columns: ['Qty', 'Price'], rows: [['12', '18']] } },
];

function createCrudFacadeDouble(
  overrides: Partial<Omit<ResourceCrudVmFacade, 'vm'>> = {},
): CrudFacadeDouble {
  return {
    key: 'order-details',
    heading: 'Order Details API',
    description: 'Manage order detail rows.',
    primaryIdLabel: 'Product ID',
    secondaryIdLabel: 'Order ID',
    defaultPrimaryId: '1',
    defaultSecondaryId: '10248',
    pageDefaults: { initialPrimaryId: '1' },
    vm: signal(IDLE_VM),
    onPageEnter: vi.fn(() => ({ primaryId: '11', secondaryId: '10249' })),
    mapSelectedItemSections: vi.fn(() => DETAIL_SECTIONS),
    mapMutationResultSections: vi.fn(() => DETAIL_SECTIONS),
    reload: vi.fn(),
    setSearchTerm: vi.fn(),
    toggleSortDirection: vi.fn(),
    goToPage: vi.fn(),
    fetchById: vi.fn(),
    deleteById: vi.fn(),
    createSample: vi.fn(),
    updateSample: vi.fn(),
    ...overrides,
  };
}

describe('ResourcePageComponent', () => {
  let harness: RouterTestingHarness;
  let crudFacade: CrudFacadeDouble;
  let systemFacade: SystemFacadeDouble;
  let registry: Pick<ResourceVmRegistryService, 'getCrudFacade' | 'getSystemFacade'>;

  function page(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement {
    const match = Array.from(page().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!match) {
      throw new Error(`No button labelled "${label}"`);
    }
    return match;
  }

  function field(label: string): HTMLInputElement | null {
    const match = Array.from(page().querySelectorAll('label')).find(
      (candidate) => candidate.querySelector('span')?.textContent?.trim() === label,
    );
    return match?.querySelector('input') ?? null;
  }

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  }

  async function open(url: string): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, ResourcePageComponent);
    await harness.fixture.whenStable();
  }

  async function setVm(changes: Partial<ResourceCrudViewModel>): Promise<void> {
    crudFacade.vm.set({ ...IDLE_VM, ...changes });
    await harness.fixture.whenStable();
  }

  beforeEach(() => {
    crudFacade = createCrudFacadeDouble();
    systemFacade = {
      key: 'system',
      heading: 'System API',
      description: 'Run backend health checks from a dedicated page.',
      vm: signal(IDLE_SYSTEM_VM),
      runHealthcheck: vi.fn(),
      runAbout: vi.fn(),
    };
    registry = {
      getCrudFacade: vi.fn((key) => (key === 'system' ? null : crudFacade)),
      getSystemFacade: vi.fn(() => systemFacade),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(ROUTES),
        { provide: ResourceVmRegistryService, useValue: registry },
      ],
    });
  });

  it('creates the component', async () => {
    await open('/resources/orders');

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(ResourcePageComponent);
  });

  describe('active resource', () => {
    it('looks up the facade for the resource key in the route data', async () => {
      await open('/resources/orders');

      expect(registry.getCrudFacade).toHaveBeenLastCalledWith('orders');
    });

    it.each([
      { label: 'an unknown key', url: '/resources/bogus' },
      { label: 'a non-string key', url: '/resources/numeric' },
      { label: 'no key', url: '/resources/no-key' },
    ])('falls back to categories for $label', async ({ url }) => {
      await open(url);

      expect(registry.getCrudFacade).toHaveBeenLastCalledWith('categories');
    });
  });

  describe('heading and description', () => {
    it('shows the heading and description of the active resource facade', async () => {
      await open('/resources/order-details');

      expect(page().querySelector('h2')?.textContent).toBe('Order Details API');
      expect(page().querySelector('header p')?.textContent).toBe('Manage order detail rows.');
    });

    it('shows the system heading and description on the system page', async () => {
      await open('/resources/system');

      expect(page().querySelector('h2')?.textContent).toBe('System API');
      expect(page().querySelector('header p')?.textContent).toBe(
        'Run backend health checks from a dedicated page.',
      );
    });
  });

  describe('links', () => {
    it('links to every resource page', async () => {
      await open('/resources/orders');

      const links = Array.from(
        page().querySelectorAll<HTMLAnchorElement>('nav[aria-label="Resource pages"] a'),
      ).map((link) => [link.textContent?.trim(), link.getAttribute('href')]);

      expect(links).toEqual([
        ['Categories', '/resources/categories'],
        ['Customers', '/resources/customers'],
        ['Employees', '/resources/employees'],
        ['Order Details', '/resources/order-details'],
        ['Orders', '/resources/orders'],
        ['Products', '/resources/products'],
        ['Shippers', '/resources/shippers'],
        ['Suppliers', '/resources/suppliers'],
        ['System', '/resources/system'],
      ]);
    });
  });

  describe('crud resource page', () => {
    describe('page entry', () => {
      it('notifies the facade once and fills the id fields from its entry state', async () => {
        await open('/resources/order-details');

        expect(crudFacade.onPageEnter).toHaveBeenCalledTimes(1);
        expect(field('Product ID')?.value).toBe('11');
        expect(field('Order ID')?.value).toBe('10249');
      });

      it('leaves the secondary id empty when the entry state has none', async () => {
        vi.mocked(crudFacade.onPageEnter).mockReturnValue({ primaryId: '3' });

        await open('/resources/order-details');

        expect(field('Order ID')?.value).toBe('');
      });

      it('hides the secondary id field when the facade has no secondary label', async () => {
        crudFacade = createCrudFacadeDouble({ secondaryIdLabel: undefined });

        await open('/resources/orders');

        expect(field('Product ID')).not.toBeNull();
        expect(field('Order ID')).toBeNull();
      });
    });

    describe('onSearchTermChanged', () => {
      it('passes the typed search term to the facade', async () => {
        await open('/resources/orders');

        await type(field('Search')!, 'chai');

        expect(crudFacade.setSearchTerm).toHaveBeenCalledWith('chai');
      });
    });

    describe('onToggleSortDirection', () => {
      it('toggles the sort direction when Toggle Sort is clicked', async () => {
        await open('/resources/orders');

        button('Toggle Sort').click();

        expect(crudFacade.toggleSortDirection).toHaveBeenCalledTimes(1);
      });
    });

    describe('onReload', () => {
      it('force-reloads when Refresh is clicked', async () => {
        await open('/resources/orders');

        button('Refresh').click();

        expect(crudFacade.reload).toHaveBeenCalledExactlyOnceWith(true);
      });

      it('force-reloads when Try Again is clicked in the error alert', async () => {
        await open('/resources/orders');
        await setVm({ errorMessage: 'API unreachable' });

        button('Try Again').click();

        expect(crudFacade.reload).toHaveBeenCalledExactlyOnceWith(true);
      });
    });

    describe('onFetchById', () => {
      it('fetches using the entry ids', async () => {
        await open('/resources/order-details');

        button('Get By Id').click();

        expect(crudFacade.fetchById).toHaveBeenCalledExactlyOnceWith('11', '10249');
      });

      it('fetches using ids typed by the user', async () => {
        await open('/resources/order-details');
        await type(field('Product ID')!, '42');
        await type(field('Order ID')!, '10300');

        button('Get By Id').click();

        expect(crudFacade.fetchById).toHaveBeenCalledExactlyOnceWith('42', '10300');
      });
    });

    describe('onDeleteById', () => {
      it('deletes using the current ids', async () => {
        await open('/resources/order-details');

        button('Delete').click();

        expect(crudFacade.deleteById).toHaveBeenCalledExactlyOnceWith('11', '10249');
      });
    });

    describe('onCreateSample', () => {
      it('creates a sample record', async () => {
        await open('/resources/orders');

        button('Create Sample').click();

        expect(crudFacade.createSample).toHaveBeenCalledTimes(1);
      });
    });

    describe('onUpdateSample', () => {
      it('updates the sample record for the current ids', async () => {
        await open('/resources/order-details');

        button('Update Sample').click();

        expect(crudFacade.updateSample).toHaveBeenCalledExactlyOnceWith('11', '10249');
      });
    });

    describe('loading and error states', () => {
      it('shows a loading message and disables the actions while loading', async () => {
        await open('/resources/orders');

        await setVm({ isLoading: true });

        expect(page().textContent).toContain('Loading data...');
        for (const label of [
          'Toggle Sort',
          'Refresh',
          'Get By Id',
          'Delete',
          'Create Sample',
          'Update Sample',
        ]) {
          expect(button(label).disabled, label).toBe(true);
        }
      });

      it('shows the error message in an alert', async () => {
        await open('/resources/orders');

        await setVm({ errorMessage: 'API unreachable' });

        const alert = page().querySelector('[role="alert"]');
        expect(alert?.textContent).toContain('Request failed');
        expect(alert?.textContent).toContain('API unreachable');
      });

      it('shows the empty-state message when nothing matches', async () => {
        await open('/resources/orders');

        await setVm({ hasEmptyState: true });

        expect(page().textContent).toContain('No records matched your current filters.');
      });
    });

    describe('record list and pagination', () => {
      const RECORDS = [
        {
          primaryId: '11',
          secondaryId: '10248',
          title: 'Order 10248 • Product 11',
          subtitle: 'Qty 12',
          raw: {},
        },
        { primaryId: '42', title: 'Order 10249', subtitle: 'Qty 1', raw: {} },
      ];

      it('renders each paged record with its title, subtitle, and ids', async () => {
        await open('/resources/orders');

        await setVm({ items: RECORDS, pagedItems: RECORDS, totalItems: 2 });

        const entries = Array.from(page().querySelectorAll('li')).map((li) => [
          li.querySelector('h3')?.textContent,
          li.querySelector('p')?.textContent,
          li.querySelector('small')?.textContent?.replace(/\s+/g, ' ').trim(),
        ]);
        expect(entries).toEqual([
          ['Order 10248 • Product 11', 'Qty 12', 'ID: 11 / 10248'],
          ['Order 10249', 'Qty 1', 'ID: 42'],
        ]);
      });

      it('shows the page position and total record count', async () => {
        await open('/resources/orders');

        await setVm({ pagedItems: RECORDS, totalItems: 18, page: 2, totalPages: 3 });

        expect(page().textContent).toContain('Page 2 of 3 · 18 total records');
      });

      it('does not render the list or pagination when there are no records', async () => {
        await open('/resources/orders');

        const previous = Array.from(page().querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Previous',
        );

        expect(previous).toBeUndefined();
      });

      it('disables Previous on the first page and Next on the last page', async () => {
        await open('/resources/orders');

        await setVm({ pagedItems: RECORDS, totalItems: 2, page: 1, totalPages: 1 });

        expect(button('Previous').disabled).toBe(true);
        expect(button('Next').disabled).toBe(true);
      });

      it('goes to the next page when Next is clicked (onPageChanged)', async () => {
        await open('/resources/orders');
        await setVm({ pagedItems: RECORDS, totalItems: 18, page: 2, totalPages: 3 });

        button('Next').click();

        expect(crudFacade.goToPage).toHaveBeenCalledExactlyOnceWith(3);
      });

      it('goes to the previous page when Previous is clicked (onPageChanged)', async () => {
        await open('/resources/orders');
        await setVm({ pagedItems: RECORDS, totalItems: 18, page: 2, totalPages: 3 });

        button('Previous').click();

        expect(crudFacade.goToPage).toHaveBeenCalledExactlyOnceWith(1);
      });
    });

    describe('selectedSections', () => {
      it('renders the sections the facade maps for the selected item', async () => {
        await open('/resources/orders');

        await setVm({ selectedItem: { productId: 1 } });

        const panel = Array.from(page().querySelectorAll('section')).find(
          (section) => section.querySelector('h3')?.textContent === 'Selected record',
        );
        expect(crudFacade.mapSelectedItemSections).toHaveBeenCalledWith({ productId: 1 });
        expect(panel?.querySelector('dt')?.textContent).toBe('Name');
        expect(panel?.querySelector('dd')?.textContent).toBe('Chai');
        expect(Array.from(panel?.querySelectorAll('th') ?? []).map((th) => th.textContent)).toEqual(
          ['Qty', 'Price'],
        );
        expect(Array.from(panel?.querySelectorAll('td') ?? []).map((td) => td.textContent)).toEqual(
          ['12', '18'],
        );
      });

      it('renders no selected record panel when nothing is selected', async () => {
        await open('/resources/orders');

        const headings = Array.from(page().querySelectorAll('h3')).map((h3) => h3.textContent);

        expect(headings).not.toContain('Selected record');
        expect(crudFacade.mapSelectedItemSections).not.toHaveBeenCalled();
      });
    });

    describe('mutationSections', () => {
      it('renders the sections the facade maps for the last mutation result', async () => {
        await open('/resources/orders');

        await setVm({ mutationResult: { id: 9 } });

        const headings = Array.from(page().querySelectorAll('h3')).map((h3) => h3.textContent);
        expect(crudFacade.mapMutationResultSections).toHaveBeenCalledWith({ id: 9 });
        expect(headings).toContain('Last mutation result');
      });

      it('renders no mutation panel when there is no mutation result', async () => {
        await open('/resources/orders');

        const headings = Array.from(page().querySelectorAll('h3')).map((h3) => h3.textContent);

        expect(headings).not.toContain('Last mutation result');
      });
    });
  });

  describe('system page', () => {
    async function setSystemVm(changes: Partial<SystemVmState>): Promise<void> {
      systemFacade.vm.set({ ...IDLE_SYSTEM_VM, ...changes });
      await harness.fixture.whenStable();
    }

    it('does not render the crud controls', async () => {
      await open('/resources/system');

      expect(field('Search')).toBeNull();
      expect(crudFacade.onPageEnter).not.toHaveBeenCalled();
    });

    it('runs the healthcheck when Run Healthcheck is clicked (onRunHealthcheck)', async () => {
      await open('/resources/system');

      button('Run Healthcheck').click();

      expect(systemFacade.runHealthcheck).toHaveBeenCalledTimes(1);
    });

    it('loads the about information when Load About is clicked (onRunAbout)', async () => {
      await open('/resources/system');

      button('Load About').click();

      expect(systemFacade.runAbout).toHaveBeenCalledTimes(1);
    });

    it('shows a progress message and disables the actions while loading', async () => {
      await open('/resources/system');

      await setSystemVm({ isLoading: true });

      expect(page().textContent).toContain('Running health check...');
      expect(button('Run Healthcheck').disabled).toBe(true);
      expect(button('Load About').disabled).toBe(true);
    });

    it('shows the error message in an alert', async () => {
      await open('/resources/system');

      await setSystemVm({ errorMessage: 'Service unavailable' });

      const alert = page().querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Health check failed');
      expect(alert?.textContent).toContain('Service unavailable');
    });

    it('shows the latest healthcheck result and about response', async () => {
      await open('/resources/system');

      await setSystemVm({ healthcheckResult: 'Healthy', aboutResult: { apiVersion: '1.1.2' } });

      expect(page().textContent).toContain('Latest healthcheck result');
      expect(page().textContent).toContain('Healthy');
      expect(page().querySelector('pre')?.textContent).toBe(
        JSON.stringify({ apiVersion: '1.1.2' }, null, 2),
      );
    });
  });
});
