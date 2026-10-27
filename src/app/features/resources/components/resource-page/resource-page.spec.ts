import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ResourceVmRegistryService } from '../../services/vm/resource-vm-registry.service';
import {
  ResourceCrudViewModel,
  ResourceCrudVmFacade,
  ResourceDetailSection,
  ResourceOperationResult,
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
  lastOperation: null,
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

const CREATE_SAMPLE = { name: 'Sample' };

function getResult(response: unknown): ResourceOperationResult {
  return { operation: 'get', request: { 'Order ID': '1' }, response, errorMessage: null };
}

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
    mapOperationResultSections: vi.fn(() => DETAIL_SECTIONS),
    createSamplePayload: vi.fn(() => CREATE_SAMPLE),
    updateSamplePayload: vi.fn((primaryId?: string) => ({ id: primaryId ?? '1', name: 'Updated' })),
    reload: vi.fn(),
    setSearchTerm: vi.fn(),
    toggleSortDirection: vi.fn(),
    goToPage: vi.fn(),
    fetchById: vi.fn(),
    deleteById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

  function editor(): HTMLTextAreaElement | null {
    return page().querySelector('textarea');
  }

  function operationOptions(): HTMLInputElement[] {
    return Array.from(page().querySelectorAll<HTMLInputElement>('fieldset input[type="radio"]'));
  }

  function selectedOperation(): string | undefined {
    return operationOptions()
      .find((option) => option.checked)
      ?.closest('label')
      ?.textContent?.trim();
  }

  async function chooseOperation(label: string): Promise<void> {
    const option = operationOptions().find(
      (candidate) => candidate.closest('label')?.textContent?.trim() === label,
    );
    if (!option) {
      throw new Error(`No operation labelled "${label}"`);
    }
    option.click();
    await harness.fixture.whenStable();
  }

  async function type(input: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
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
        await chooseOperation('Get');

        expect(crudFacade.onPageEnter).toHaveBeenCalledTimes(1);
        expect(field('Product ID')?.value).toBe('11');
        expect(field('Order ID')?.value).toBe('10249');
      });

      it('leaves the secondary id empty when the entry state has none', async () => {
        vi.mocked(crudFacade.onPageEnter).mockReturnValue({ primaryId: '3' });

        await open('/resources/order-details');
        await chooseOperation('Get');

        expect(field('Order ID')?.value).toBe('');
      });

      it('hides the secondary id field when the facade has no secondary label', async () => {
        crudFacade = createCrudFacadeDouble({ secondaryIdLabel: undefined });

        await open('/resources/orders');
        await chooseOperation('Get');

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
      it('does not render a Refresh button', async () => {
        await open('/resources/orders');

        const labels = Array.from(page().querySelectorAll('button')).map((candidate) =>
          candidate.textContent?.trim(),
        );

        expect(labels).not.toContain('Refresh');
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
        await chooseOperation('Get');

        button('Get By Id').click();

        expect(crudFacade.fetchById).toHaveBeenCalledExactlyOnceWith('11', '10249');
      });

      it('fetches using ids typed by the user', async () => {
        await open('/resources/order-details');
        await chooseOperation('Get');
        await type(field('Product ID')!, '42');
        await type(field('Order ID')!, '10300');

        button('Get By Id').click();

        expect(crudFacade.fetchById).toHaveBeenCalledExactlyOnceWith('42', '10300');
      });
    });

    describe('onOperationChanged', () => {
      it('offers Load All as the first operation, followed by the record operations', async () => {
        await open('/resources/orders');

        const labels = operationOptions().map((option) =>
          option.closest('label')?.textContent?.trim(),
        );

        expect(labels).toEqual(['Load All', 'Get', 'Create', 'Update', 'Delete']);
      });

      it('starts on Load All without id fields or a request body', async () => {
        await open('/resources/order-details');

        expect(selectedOperation()).toBe('Load All');
        expect(field('Product ID')).toBeNull();
        expect(editor()).toBeNull();
      });

      it('shows the id fields and the Get By Id action for Get', async () => {
        await open('/resources/order-details');

        await chooseOperation('Get');

        expect(selectedOperation()).toBe('Get');
        expect(field('Product ID')).not.toBeNull();
        expect(button('Get By Id')).toBeInstanceOf(HTMLButtonElement);
      });

      it('force-reloads the list when Load All is chosen again', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');

        await chooseOperation('Load All');

        expect(selectedOperation()).toBe('Load All');
        expect(crudFacade.reload).toHaveBeenCalledExactlyOnceWith(true);
      });

      it('does not reload when a record operation is chosen', async () => {
        await open('/resources/orders');

        await chooseOperation('Get');
        await chooseOperation('Create');
        await chooseOperation('Update');
        await chooseOperation('Delete');

        expect(crudFacade.reload).not.toHaveBeenCalled();
      });

      it('returns to Load All when another resource page is opened', async () => {
        await open('/resources/orders');
        await chooseOperation('Delete');

        await harness.navigateByUrl('/resources/categories', ResourcePageComponent);
        await harness.fixture.whenStable();

        expect(selectedOperation()).toBe('Load All');
      });

      it('shows the request body editor without id fields for Create', async () => {
        await open('/resources/order-details');

        await chooseOperation('Create');

        expect(selectedOperation()).toBe('Create');
        expect(field('Product ID')).toBeNull();
        expect(editor()).not.toBeNull();
      });

      it('shows the id fields and the request body editor for Update', async () => {
        await open('/resources/order-details');

        await chooseOperation('Update');

        expect(field('Product ID')).not.toBeNull();
        expect(editor()).not.toBeNull();
      });

      it('clears a request body error when another operation is chosen', async () => {
        await open('/resources/orders');
        await chooseOperation('Create');
        await type(editor()!, '{');
        button('Create').click();
        await harness.fixture.whenStable();

        await chooseOperation('Update');

        expect(page().querySelector('[role="alert"]')).toBeNull();
      });
    });

    describe('onOperationClicked', () => {
      it('force-reloads the list when the selected Load All is clicked', async () => {
        await open('/resources/orders');

        await chooseOperation('Load All');

        expect(crudFacade.reload).toHaveBeenCalledExactlyOnceWith(true);
      });

      it('does not reload when the selected Load All is clicked while loading', async () => {
        await open('/resources/orders');
        await setVm({ isLoading: true });

        await chooseOperation('Load All');

        expect(crudFacade.reload).not.toHaveBeenCalled();
      });
    });

    describe('onDeleteById', () => {
      it('deletes using the current ids', async () => {
        await open('/resources/order-details');
        await chooseOperation('Delete');

        button('Delete').click();

        expect(crudFacade.deleteById).toHaveBeenCalledExactlyOnceWith('11', '10249');
      });

      it('deletes using ids typed by the user', async () => {
        await open('/resources/order-details');
        await chooseOperation('Delete');
        await type(field('Product ID')!, '42');

        button('Delete').click();

        expect(crudFacade.deleteById).toHaveBeenCalledExactlyOnceWith('42', '10249');
      });
    });

    describe('createPayloadText', () => {
      it('prefills the request body with the facade create sample', async () => {
        await open('/resources/orders');

        await chooseOperation('Create');

        expect(editor()?.value).toBe(JSON.stringify(CREATE_SAMPLE, null, 2));
      });
    });

    describe('onCreate', () => {
      it('creates the record from the edited request body', async () => {
        await open('/resources/orders');
        await chooseOperation('Create');
        await type(editor()!, '{ "name": "Typed" }');

        button('Create').click();

        expect(crudFacade.create).toHaveBeenCalledExactlyOnceWith({ name: 'Typed' });
      });

      it.each([
        { label: 'not valid JSON', body: '{ "name": ', message: 'not valid JSON' },
        { label: 'a JSON array', body: '[1, 2]', message: 'must be a JSON object' },
        { label: 'JSON null', body: 'null', message: 'must be a JSON object' },
      ])(
        'shows an error and does not create when the body is $label',
        async ({ body, message }) => {
          await open('/resources/orders');
          await chooseOperation('Create');
          await type(editor()!, body);

          button('Create').click();
          await harness.fixture.whenStable();

          expect(page().querySelector('[role="alert"]')?.textContent).toContain(message);
          expect(crudFacade.create).not.toHaveBeenCalled();
        },
      );
    });

    describe('onCreatePayloadChanged', () => {
      it('clears the request body error when the body is edited', async () => {
        await open('/resources/orders');
        await chooseOperation('Create');
        await type(editor()!, '{');
        button('Create').click();
        await harness.fixture.whenStable();

        await type(editor()!, '{}');

        expect(page().querySelector('[role="alert"]')).toBeNull();
      });
    });

    describe('onLoadCreateSample', () => {
      it('restores the create sample when Load Sample is clicked', async () => {
        await open('/resources/orders');
        await chooseOperation('Create');
        await type(editor()!, '{}');

        button('Load Sample').click();
        await harness.fixture.whenStable();

        expect(editor()?.value).toBe(JSON.stringify(CREATE_SAMPLE, null, 2));
      });
    });

    describe('updatePayloadText', () => {
      it('prefills the request body with the facade update sample', async () => {
        await open('/resources/orders');

        await chooseOperation('Update');

        expect(crudFacade.updateSamplePayload).toHaveBeenCalledWith();
        expect(editor()?.value).toBe(JSON.stringify({ id: '1', name: 'Updated' }, null, 2));
      });

      it('fills the request body with the record fetched by Get By Id', async () => {
        await open('/resources/orders');
        await chooseOperation('Update');

        await setVm({ lastOperation: getResult({ orderId: 7, shipName: 'Vins' }) });

        expect(editor()?.value).toBe(JSON.stringify({ orderId: 7, shipName: 'Vins' }, null, 2));
      });

      it('keeps the edited body when the last result is cleared', async () => {
        await open('/resources/orders');
        await chooseOperation('Update');
        await setVm({ lastOperation: getResult({ orderId: 7 }) });
        await type(editor()!, '{ "orderId": 8 }');

        await setVm({ lastOperation: null, isLoading: true });

        expect(editor()?.value).toBe('{ "orderId": 8 }');
      });
    });

    describe('onUpdate', () => {
      it('updates the record from the edited request body', async () => {
        await open('/resources/orders');
        await chooseOperation('Update');
        await type(editor()!, '{ "orderId": 8 }');

        button('Update').click();

        expect(crudFacade.update).toHaveBeenCalledExactlyOnceWith({ orderId: 8 });
      });

      it('shows an error and does not update when the body is not valid JSON', async () => {
        await open('/resources/orders');
        await chooseOperation('Update');
        await type(editor()!, 'orderId: 8');

        button('Update').click();
        await harness.fixture.whenStable();

        expect(page().querySelector('[role="alert"]')?.textContent).toContain('not valid JSON');
        expect(crudFacade.update).not.toHaveBeenCalled();
      });
    });

    describe('onUpdatePayloadChanged', () => {
      it('clears the request body error when the body is edited', async () => {
        await open('/resources/orders');
        await chooseOperation('Update');
        await type(editor()!, '{');
        button('Update').click();
        await harness.fixture.whenStable();

        await type(editor()!, '{}');

        expect(page().querySelector('[role="alert"]')).toBeNull();
      });
    });

    describe('onLoadUpdateSample', () => {
      it('loads the update sample for the current ids when Load Sample is clicked', async () => {
        await open('/resources/order-details');
        await chooseOperation('Update');

        button('Load Sample').click();
        await harness.fixture.whenStable();

        expect(crudFacade.updateSamplePayload).toHaveBeenLastCalledWith('11', '10249');
        expect(editor()?.value).toBe(JSON.stringify({ id: '11', name: 'Updated' }, null, 2));
      });
    });

    describe('Load Record', () => {
      it('fetches the record for the current ids', async () => {
        await open('/resources/order-details');
        await chooseOperation('Update');

        button('Load Record').click();

        expect(crudFacade.fetchById).toHaveBeenCalledExactlyOnceWith('11', '10249');
      });
    });

    describe('loading and error states', () => {
      it('shows a loading message while the list loads', async () => {
        await open('/resources/orders');

        await setVm({ isLoading: true });

        expect(page().textContent).toContain('Loading data...');
      });

      it('shows a sending message while a record operation runs', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');

        await setVm({ isLoading: true });

        expect(page().textContent).toContain('Sending request...');
        expect(page().textContent).not.toContain('Loading data...');
      });

      it.each([
        { operation: 'Get', labels: ['Toggle Sort', 'Get By Id'] },
        { operation: 'Create', labels: ['Load Sample', 'Create'] },
        { operation: 'Update', labels: ['Load Record', 'Load Sample', 'Update'] },
        { operation: 'Delete', labels: ['Delete'] },
      ])('disables the $operation actions while loading', async ({ operation, labels }) => {
        await open('/resources/orders');
        await chooseOperation(operation);

        await setVm({ isLoading: true });

        for (const label of labels) {
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

      it.each(['Get', 'Create', 'Update', 'Delete'])(
        'hides the list error and empty state under %s',
        async (operation) => {
          await open('/resources/orders');
          await chooseOperation(operation);

          await setVm({ errorMessage: 'API unreachable', hasEmptyState: true });

          expect(page().textContent).not.toContain('API unreachable');
          expect(page().textContent).not.toContain('No records matched');
        },
      );
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

      it.each(['Get', 'Create', 'Update', 'Delete'])(
        'hides the list and pagination under %s',
        async (operation) => {
          await open('/resources/orders');
          await chooseOperation(operation);

          await setVm({ items: RECORDS, pagedItems: RECORDS, totalItems: 2 });

          expect(page().querySelector('ul')).toBeNull();
          expect(page().textContent).not.toContain('total records');
        },
      );

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

    describe('operation result', () => {
      function resultPanel(): HTMLElement | null {
        return page().querySelector('section[aria-labelledby="operation-result-heading"]');
      }

      it('renders no result panel before an operation completes', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');

        expect(resultPanel()).toBeNull();
        expect(crudFacade.mapOperationResultSections).not.toHaveBeenCalled();
      });

      it('shows the operation, status, and the sections the facade maps for the result', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');
        const result = getResult({ productId: 1 });

        await setVm({ lastOperation: result });

        const panel = resultPanel();
        expect(crudFacade.mapOperationResultSections).toHaveBeenCalledWith(result);
        expect(panel?.querySelector('h3')?.textContent).toBe('Get By Id result');
        expect(panel?.textContent).toContain('Succeeded');
        expect(panel?.querySelector('dt')?.textContent).toBe('Name');
        expect(panel?.querySelector('dd')?.textContent).toBe('Chai');
        expect(Array.from(panel?.querySelectorAll('th') ?? []).map((th) => th.textContent)).toEqual(
          ['Qty', 'Price'],
        );
        expect(Array.from(panel?.querySelectorAll('td') ?? []).map((td) => td.textContent)).toEqual(
          ['12', '18'],
        );
      });

      it('shows the request and response bodies', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');

        await setVm({ lastOperation: getResult({ productId: 1 }) });

        expect(page().querySelector('[data-testid="operation-request"]')?.textContent).toBe(
          JSON.stringify({ 'Order ID': '1' }, null, 2),
        );
        expect(page().querySelector('[data-testid="operation-response"]')?.textContent).toBe(
          JSON.stringify({ productId: 1 }, null, 2),
        );
      });

      it.each([
        {
          label: 'a get without a record',
          operation: 'Get',
          result: getResult(null),
          title: 'Get By Id result',
          status: 'No record found',
        },
        {
          label: 'a delete without content',
          operation: 'Delete',
          result: { ...getResult(null), operation: 'delete' as const },
          title: 'Delete result',
          status: 'Succeeded (no content returned)',
        },
        {
          label: 'a create with a response',
          operation: 'Create',
          result: { ...getResult({ id: 9 }), operation: 'create' as const },
          title: 'Create result',
          status: 'Succeeded',
        },
        {
          label: 'a failed update',
          operation: 'Update',
          result: { ...getResult(null), operation: 'update' as const, errorMessage: 'Gone' },
          title: 'Update result',
          status: 'Failed',
        },
      ])(
        'titles and reports the status of $label',
        async ({ operation, result, title, status }) => {
          await open('/resources/orders');
          await chooseOperation(operation);

          await setVm({ lastOperation: result });

          expect(resultPanel()?.querySelector('h3')?.textContent).toBe(title);
          expect(resultPanel()?.querySelector('header span')?.textContent?.trim()).toBe(status);
        },
      );

      it('shows "(no content)" when the response is empty', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');

        await setVm({ lastOperation: getResult(null) });

        expect(page().querySelector('[data-testid="operation-response"]')?.textContent).toBe(
          '(no content)',
        );
      });

      it('shows the error message of a failed request', async () => {
        await open('/resources/orders');
        await chooseOperation('Get');

        await setVm({ lastOperation: { ...getResult(null), errorMessage: 'Not authorized' } });

        expect(resultPanel()?.textContent).toContain('Not authorized');
      });

      it('shows the result of Load Record (a get) under Update', async () => {
        await open('/resources/orders');
        await chooseOperation('Update');

        await setVm({ lastOperation: getResult({ productId: 1 }) });

        expect(resultPanel()?.querySelector('h3')?.textContent).toBe('Get By Id result');
      });

      it.each(['Load All', 'Delete'])('hides a get result under %s', async (operation) => {
        await open('/resources/orders');
        await chooseOperation(operation);

        await setVm({ lastOperation: getResult({ productId: 1 }) });

        expect(resultPanel()).toBeNull();
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
