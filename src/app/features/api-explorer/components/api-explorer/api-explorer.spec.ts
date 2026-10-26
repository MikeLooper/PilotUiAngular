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
    it('lists a quick link for every resource by default', () => {
      const links = Array.from(
        page().querySelectorAll<HTMLAnchorElement>('nav[aria-label="API resource quick links"] a'),
      );

      expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual(
        SECTIONS.map((section) => [section.title, `#${section.key}`]),
      );
    });

    it('hides the quick links when false', async () => {
      fixture.componentRef.setInput('showNavigation', false);

      await fixture.whenStable();

      expect(page().querySelector('nav')).toBeNull();
    });
  });

  describe('resourceKey', () => {
    it('shows every resource panel when no key is set', () => {
      const titles = Array.from(page().querySelectorAll('article h3')).map((h) => h.textContent);

      expect(titles).toEqual(SECTIONS.map((section) => section.title));
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

      it('renders the list, item, and mutation results as JSON', async () => {
        states[section.stateKey].set({
          ...initialResourcePanelState,
          listResult: [{ id: 1 }],
          itemResult: { id: 2 },
          mutationResult: { success: true },
        });

        await fixture.whenStable();

        const results = Array.from(panel(section.key).querySelectorAll('pre')).map(
          (pre) => pre.textContent,
        );
        expect(results).toEqual([
          JSON.stringify([{ id: 1 }], null, 2),
          JSON.stringify({ id: 2 }, null, 2),
          JSON.stringify({ success: true }, null, 2),
        ]);
      });
    });

    it('sends the edited id when fetching by id', async () => {
      const [getIdInput] = fieldsLabelled(panel('categories'), 'Category ID');
      await typeInto(getIdInput!, '5');

      button(panel('categories'), 'Get By ID').click();

      expect(methods['getCategoryById']).toHaveBeenCalledExactlyOnceWith('5');
    });

    it('sends the edited ids when deleting by id', async () => {
      const deleteProductInput = fieldsLabelled(panel('order-details'), 'Product ID')[1];
      const deleteOrderInput = fieldsLabelled(panel('order-details'), 'Order ID')[1];
      await typeInto(deleteProductInput!, '7');
      await typeInto(deleteOrderInput!, '10300');

      button(panel('order-details'), 'Delete').click();

      expect(methods['deleteOrderDetail']).toHaveBeenCalledExactlyOnceWith('7', '10300');
    });

    it('sends the edited payload when adding', async () => {
      const textarea = panel('shippers').querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = '{"companyName":"Edited"}';
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      button(panel('shippers'), 'Add').click();

      expect(methods['addShipper']).toHaveBeenCalledExactlyOnceWith('{"companyName":"Edited"}');
    });

    it('shows second id fields only for order details', () => {
      const orderIdFields = fieldsLabelled(panel('order-details'), 'Order ID');
      const ordersPanelFields = panel('orders').querySelectorAll('label input');

      expect(orderIdFields).toHaveLength(2);
      expect(ordersPanelFields).toHaveLength(2);
    });

    it('shows a progress message while a request is in flight', async () => {
      states.products.set({ ...initialResourcePanelState, loading: true });

      await fixture.whenStable();

      expect(panel('products').textContent).toContain('Request in progress...');
      expect(panel('orders').textContent).not.toContain('Request in progress...');
    });

    it('shows the panel error', async () => {
      states.suppliers.set({
        ...initialResourcePanelState,
        error: 'Invalid Suppliers payload JSON.',
      });

      await fixture.whenStable();

      expect(panel('suppliers').textContent).toContain('Invalid Suppliers payload JSON.');
    });
  });
});
