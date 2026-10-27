import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import {
  ResourcePanelState,
  initialResourcePanelState,
} from '../../../resources/services/resource-panel-state';
import { ApiExplorerService } from '../../services/api-explorer';
import { ApiExplorerComponent } from './api-explorer';

const STATE_KEYS = [
  'categories',
  'customers',
  'employees',
  'orderDetails',
  'orders',
  'products',
  'shippers',
  'suppliers',
  'system',
] as const;

type StateKey = (typeof STATE_KEYS)[number];

interface SectionCase {
  readonly key: string;
  readonly title: string;
  readonly stateKey: StateKey;
  readonly load: string;
  readonly get: string;
  readonly getArgs: readonly string[];
  readonly add: string;
  readonly addSnippet: string;
  readonly update: string;
  readonly updateSnippet: string;
  readonly remove: string;
  readonly removeArgs: readonly string[];
}

const SECTIONS: readonly SectionCase[] = [
  {
    key: 'categories',
    title: 'Categories',
    stateKey: 'categories',
    load: 'loadCategories',
    get: 'getCategoryById',
    getArgs: ['1'],
    add: 'addCategory',
    addSnippet: '"categoryName": "New category"',
    update: 'updateCategory',
    updateSnippet: '"categoryName": "Updated name"',
    remove: 'deleteCategory',
    removeArgs: ['1'],
  },
  {
    key: 'customers',
    title: 'Customers',
    stateKey: 'customers',
    load: 'loadCustomers',
    get: 'getCustomerById',
    getArgs: ['ALFKI'],
    add: 'addCustomer',
    addSnippet: '"customerId": "NEW01"',
    update: 'updateCustomer',
    updateSnippet: '"companyName": "Updated Company"',
    remove: 'deleteCustomer',
    removeArgs: ['ALFKI'],
  },
  {
    key: 'employees',
    title: 'Employees',
    stateKey: 'employees',
    load: 'loadEmployees',
    get: 'getEmployeeById',
    getArgs: ['1'],
    add: 'addEmployee',
    addSnippet: '"firstName": "John"',
    update: 'updateEmployee',
    updateSnippet: '"firstName": "Nancy"',
    remove: 'deleteEmployee',
    removeArgs: ['10'],
  },
  {
    key: 'order-details',
    title: 'Order Details',
    stateKey: 'orderDetails',
    load: 'loadOrderDetails',
    get: 'getOrderDetailById',
    getArgs: ['1', '10248'],
    add: 'addOrderDetail',
    addSnippet: '"quantity": 10',
    update: 'updateOrderDetail',
    updateSnippet: '"quantity": 12',
    remove: 'deleteOrderDetail',
    removeArgs: ['1', '10248'],
  },
  {
    key: 'orders',
    title: 'Orders',
    stateKey: 'orders',
    load: 'loadOrders',
    get: 'getOrderById',
    getArgs: ['10248'],
    add: 'addOrder',
    addSnippet: '"shipName": "Acme"',
    update: 'updateOrder',
    updateSnippet: '"shipCity": "Portland"',
    remove: 'deleteOrder',
    removeArgs: ['11077'],
  },
  {
    key: 'products',
    title: 'Products',
    stateKey: 'products',
    load: 'loadProducts',
    get: 'getProductById',
    getArgs: ['1'],
    add: 'addProduct',
    addSnippet: '"productName": "New Product"',
    update: 'updateProduct',
    updateSnippet: '"productName": "Updated Product"',
    remove: 'deleteProduct',
    removeArgs: ['78'],
  },
  {
    key: 'shippers',
    title: 'Shippers',
    stateKey: 'shippers',
    load: 'loadShippers',
    get: 'getShipperById',
    getArgs: ['1'],
    add: 'addShipper',
    addSnippet: '"companyName": "Fast Freight"',
    update: 'updateShipper',
    updateSnippet: '"companyName": "Speedy Express"',
    remove: 'deleteShipper',
    removeArgs: ['4'],
  },
  {
    key: 'suppliers',
    title: 'Suppliers',
    stateKey: 'suppliers',
    load: 'loadSuppliers',
    get: 'getSupplierById',
    getArgs: ['1'],
    add: 'addSupplier',
    addSnippet: '"companyName": "Supplier One"',
    update: 'updateSupplier',
    updateSnippet: '"companyName": "Updated Supplier"',
    remove: 'deleteSupplier',
    removeArgs: ['30'],
  },
];

const LIST_RESULT = [{ id: 1 }];
const ITEM_RESULT = { id: 2 };
const MUTATION_RESULT = { success: true };
const ALL_RESULTS_STATE: ResourcePanelState = {
  ...initialResourcePanelState,
  listResult: LIST_RESULT,
  itemResult: ITEM_RESULT,
  mutationResult: MUTATION_RESULT,
};

describe('ApiExplorerComponent', () => {
  let fixture: ComponentFixture<ApiExplorerComponent>;
  let states: Record<StateKey, WritableSignal<ResourcePanelState>>;
  let methods: Record<string, Mock>;

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function panel(key: string): HTMLElement {
    const match = page().querySelector<HTMLElement>(`article[id="${key}"]`);
    if (!match) {
      throw new Error(`No resource panel "${key}"`);
    }
    return match;
  }

  function button(container: HTMLElement, label: string): HTMLButtonElement {
    const match = Array.from(container.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!match) {
      throw new Error(`No button labelled "${label}"`);
    }
    return match;
  }

  function fieldsLabelled(container: HTMLElement, label: string): HTMLInputElement[] {
    return Array.from(container.querySelectorAll('label'))
      .filter((candidate) => candidate.textContent?.trim() === label)
      .map((candidate) => candidate.querySelector('input') as HTMLInputElement);
  }

  function resultText(key: string): (string | null)[] {
    return Array.from(panel(key).querySelectorAll('pre')).map((pre) => pre.textContent);
  }

  async function selectDomain(title: string): Promise<void> {
    button(page(), title).click();
    await fixture.whenStable();
    Object.values(methods).forEach((method) => method.mockClear());
  }

  async function typeInto(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    states = Object.fromEntries(
      STATE_KEYS.map((key) => [key, signal<ResourcePanelState>(initialResourcePanelState)]),
    ) as Record<StateKey, WritableSignal<ResourcePanelState>>;
    methods = Object.fromEntries(
      Object.getOwnPropertyNames(ApiExplorerService.prototype)
        .filter((name) => name !== 'constructor')
        .map((name) => [name, vi.fn()]),
    );

    TestBed.configureTestingModule({
      imports: [ApiExplorerComponent],
      providers: [{ provide: ApiExplorerService, useValue: { ...states, ...methods } }],
    });
    fixture = TestBed.createComponent(ApiExplorerComponent);
    await fixture.whenStable();
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('showHeader', () => {
    it('shows the explorer header by default', () => {
      const heading = page().querySelector('h2');

      expect(heading?.textContent).toBe('API Explorer');
    });

    it('hides the explorer header when false', async () => {
      fixture.componentRef.setInput('showHeader', false);

      await fixture.whenStable();

      expect(page().querySelector('h2')).toBeNull();
      expect(page().textContent).not.toContain('Run System Healthcheck');
    });
  });

  describe('system actions', () => {
    it('runs the healthcheck when Run System Healthcheck is clicked', () => {
      button(page(), 'Run System Healthcheck').click();

      expect(methods['runHealthcheck']).toHaveBeenCalledTimes(1);
    });

    it('loads the about information when Load About is clicked', () => {
      button(page(), 'Load About').click();

      expect(methods['runAbout']).toHaveBeenCalledTimes(1);
    });

    it('renders the latest system result as JSON', async () => {
      states.system.set({ ...initialResourcePanelState, itemResult: { apiVersion: '1.1.2' } });

      await fixture.whenStable();

      const header = page().querySelector('header');
      expect(header?.querySelector('pre')?.textContent).toBe(
        JSON.stringify({ apiVersion: '1.1.2' }, null, 2),
      );
    });

    it('renders the system error', async () => {
      states.system.set({ ...initialResourcePanelState, error: 'API unreachable' });

      await fixture.whenStable();

      expect(page().querySelector('header')?.textContent).toContain('API unreachable');
    });
  });

  describe('showNavigation', () => {
    function quickLinks(): HTMLButtonElement[] {
      return Array.from(
        page().querySelectorAll<HTMLButtonElement>(
          'nav[aria-label="API resource quick links"] button',
        ),
      );
    }

    it('lists a quick link for every resource by default', () => {
      const labels = quickLinks().map((link) => link.textContent?.trim());

      expect(labels).toEqual(SECTIONS.map((section) => section.title));
    });

    it('renders the quick links as in-page buttons rather than navigating links', () => {
      const links = quickLinks();

      expect(links.every((link) => link.type === 'button')).toBe(true);
      expect(page().querySelectorAll('nav a')).toHaveLength(0);
    });

    it('marks the first quick link as pressed by default', () => {
      const pressed = quickLinks().map((link) => link.getAttribute('aria-pressed'));

      expect(pressed).toEqual(SECTIONS.map((_, index) => String(index === 0)));
    });

    it('shows only the first resource panel and loads its records by default', () => {
      const titles = Array.from(page().querySelectorAll('article h3')).map((h) => h.textContent);

      expect(titles).toEqual([SECTIONS[0]!.title]);
      expect(methods[SECTIONS[0]!.load]).toHaveBeenCalledExactlyOnceWith();
    });

    it('does not load any other records by default', () => {
      const otherLoads = SECTIONS.slice(1).map((section) => methods[section.load]);

      expect(otherLoads.every((load) => load!.mock.calls.length === 0)).toBe(true);
    });

    it.each(SECTIONS)(
      'shows only the $title panel and loads its records when its quick link is clicked',
      async (section) => {
        const link = button(page(), section.title);
        methods[section.load]!.mockClear();

        link.click();
        await fixture.whenStable();

        const titles = Array.from(page().querySelectorAll('article h3')).map((h) => h.textContent);
        expect(titles).toEqual([section.title]);
        expect(methods[section.load]).toHaveBeenCalledExactlyOnceWith();
        expect(button(page(), section.title).getAttribute('aria-pressed')).toBe('true');
      },
    );

    it('hides the quick links when false', async () => {
      fixture.componentRef.setInput('showNavigation', false);

      await fixture.whenStable();

      expect(page().querySelector('nav')).toBeNull();
    });
  });

  describe('resourceKey', () => {
    it('shows only the selected resource panel when no key is set', async () => {
      await selectDomain('Orders');

      const titles = Array.from(page().querySelectorAll('article h3')).map((h) => h.textContent);
      expect(titles).toEqual(['Orders']);
    });

    it('does not load the first resource when a key is set before initialization', async () => {
      const keyedFixture = TestBed.createComponent(ApiExplorerComponent);
      methods['loadCategories']!.mockClear();
      keyedFixture.componentRef.setInput('resourceKey', 'orders');

      await keyedFixture.whenStable();

      expect(methods['loadCategories']).not.toHaveBeenCalled();
    });

    it('shows every resource panel for the system key', async () => {
      fixture.componentRef.setInput('resourceKey', 'system');

      await fixture.whenStable();

      expect(page().querySelectorAll('article')).toHaveLength(SECTIONS.length);
    });

    it('shows only the matching panel and hides the quick links for a resource key', async () => {
      fixture.componentRef.setInput('resourceKey', 'orders');

      await fixture.whenStable();

      const titles = Array.from(page().querySelectorAll('article h3')).map((h) => h.textContent);
      expect(titles).toEqual(['Orders']);
      expect(page().querySelector('nav')).toBeNull();
    });

    it('shows no panels for an unknown key', async () => {
      fixture.componentRef.setInput('resourceKey', 'unknown');

      await fixture.whenStable();

      expect(page().querySelectorAll('article')).toHaveLength(0);
    });
  });

  describe('resource panels', () => {
    describe.each(SECTIONS)('$title', (section) => {
      beforeEach(async () => {
        await selectDomain(section.title);
      });

      it(`loads all records with ${section.load}`, () => {
        button(panel(section.key), 'Load All').click();

        expect(methods[section.load]).toHaveBeenCalledExactlyOnceWith();
      });

      it(`fetches the default id with ${section.get}`, () => {
        button(panel(section.key), 'Get By ID').click();

        expect(methods[section.get]).toHaveBeenCalledExactlyOnceWith(...section.getArgs);
      });

      it(`adds the default payload with ${section.add}`, () => {
        button(panel(section.key), 'Add').click();

        expect(methods[section.add]).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining(section.addSnippet),
        );
      });

      it(`updates with the default payload using ${section.update}`, () => {
        button(panel(section.key), 'Update').click();

        expect(methods[section.update]).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining(section.updateSnippet),
        );
      });

      it(`deletes the default id with ${section.remove}`, () => {
        button(panel(section.key), 'Delete').click();

        expect(methods[section.remove]).toHaveBeenCalledExactlyOnceWith(...section.removeArgs);
      });

      it('renders a single Result area showing the list result by default', async () => {
        states[section.stateKey].set(ALL_RESULTS_STATE);

        await fixture.whenStable();

        const headings = Array.from(panel(section.key).querySelectorAll('h4')).map(
          (heading) => heading.textContent,
        );
        expect(headings).toEqual(['Result']);
        expect(resultText(section.key)).toEqual([JSON.stringify(LIST_RESULT, null, 2)]);
      });

      it.each([
        { label: 'Load All', expected: LIST_RESULT },
        { label: 'Get By ID', expected: ITEM_RESULT },
        { label: 'Add', expected: MUTATION_RESULT },
        { label: 'Update', expected: MUTATION_RESULT },
        { label: 'Delete', expected: MUTATION_RESULT },
      ])('shows the $label response in the Result area', async ({ label, expected }) => {
        states[section.stateKey].set(ALL_RESULTS_STATE);

        button(panel(section.key), label).click();
        await fixture.whenStable();

        expect(resultText(section.key)).toEqual([JSON.stringify(expected, null, 2)]);
      });

      it('hides the result while a request is in flight', async () => {
        states[section.stateKey].set({ ...ALL_RESULTS_STATE, loading: true });

        await fixture.whenStable();

        expect(resultText(section.key)).toEqual([]);
      });

      it('hides the result when the request fails', async () => {
        states[section.stateKey].set({ ...ALL_RESULTS_STATE, error: 'Request failed' });

        await fixture.whenStable();

        expect(resultText(section.key)).toEqual([]);
      });
    });

    it('switches the Result area back to the list result after Load All', async () => {
      states.categories.set(ALL_RESULTS_STATE);
      button(panel('categories'), 'Get By ID').click();
      await fixture.whenStable();

      button(panel('categories'), 'Load All').click();
      await fixture.whenStable();

      expect(resultText('categories')).toEqual([JSON.stringify(LIST_RESULT, null, 2)]);
    });

    it('sends the edited id when fetching by id', async () => {
      const [getIdInput] = fieldsLabelled(panel('categories'), 'Category ID');
      await typeInto(getIdInput!, '5');

      button(panel('categories'), 'Get By ID').click();

      expect(methods['getCategoryById']).toHaveBeenCalledExactlyOnceWith('5');
    });

    it('sends the edited ids when deleting by id', async () => {
      await selectDomain('Order Details');
      const deleteProductInput = fieldsLabelled(panel('order-details'), 'Product ID')[1];
      const deleteOrderInput = fieldsLabelled(panel('order-details'), 'Order ID')[1];
      await typeInto(deleteProductInput!, '7');
      await typeInto(deleteOrderInput!, '10300');

      button(panel('order-details'), 'Delete').click();

      expect(methods['deleteOrderDetail']).toHaveBeenCalledExactlyOnceWith('7', '10300');
    });

    it('sends the edited payload when adding', async () => {
      await selectDomain('Shippers');
      const textarea = panel('shippers').querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = '{"companyName":"Edited"}';
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      button(panel('shippers'), 'Add').click();

      expect(methods['addShipper']).toHaveBeenCalledExactlyOnceWith('{"companyName":"Edited"}');
    });

    it('shows second id fields for order details', async () => {
      await selectDomain('Order Details');

      const orderIdFields = fieldsLabelled(panel('order-details'), 'Order ID');

      expect(orderIdFields).toHaveLength(2);
    });

    it('shows no second id fields for orders', async () => {
      await selectDomain('Orders');

      const ordersPanelFields = panel('orders').querySelectorAll('label input');

      expect(ordersPanelFields).toHaveLength(2);
    });

    it('shows a progress message while a request is in flight', async () => {
      await selectDomain('Products');
      states.products.set({ ...initialResourcePanelState, loading: true });

      await fixture.whenStable();

      expect(panel('products').textContent).toContain('Request in progress...');
    });

    it('shows no progress message for a panel without a request in flight', async () => {
      await selectDomain('Orders');
      states.products.set({ ...initialResourcePanelState, loading: true });

      await fixture.whenStable();

      expect(panel('orders').textContent).not.toContain('Request in progress...');
    });

    it('shows the panel error', async () => {
      await selectDomain('Suppliers');
      states.suppliers.set({
        ...initialResourcePanelState,
        error: 'Invalid Suppliers payload JSON.',
      });

      await fixture.whenStable();

      expect(panel('suppliers').textContent).toContain('Invalid Suppliers payload JSON.');
    });
  });
});
