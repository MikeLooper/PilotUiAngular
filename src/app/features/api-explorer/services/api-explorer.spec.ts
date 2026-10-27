import { Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  CategoriesResourceService,
  CustomersResourceService,
  EmployeesResourceService,
  OrderDetailsResourceService,
  OrdersResourceService,
  ProductsResourceService,
  ShippersResourceService,
  SuppliersResourceService,
  SystemResourceService,
} from '../../resources/services/resources-services';
import { initialResourcePanelState } from '../../resources/services/resource-panel-state';
import { ApiExplorerService } from './api-explorer';

type StateKey =
  | 'categories'
  | 'customers'
  | 'employees'
  | 'orderDetails'
  | 'orders'
  | 'products'
  | 'shippers'
  | 'suppliers'
  | 'system';

type ExplorerMethod = Exclude<keyof ApiExplorerService, StateKey>;

interface Delegation {
  readonly method: ExplorerMethod;
  readonly args: readonly string[];
  readonly resource: Type<unknown>;
  readonly target: string;
  readonly expectedArgs: readonly string[];
}

const CRUD_RESOURCES: ReadonlyArray<{
  readonly stateKey: StateKey;
  readonly token: Type<unknown>;
}> = [
  { stateKey: 'categories', token: CategoriesResourceService },
  { stateKey: 'customers', token: CustomersResourceService },
  { stateKey: 'employees', token: EmployeesResourceService },
  { stateKey: 'orderDetails', token: OrderDetailsResourceService },
  { stateKey: 'orders', token: OrdersResourceService },
  { stateKey: 'products', token: ProductsResourceService },
  { stateKey: 'shippers', token: ShippersResourceService },
  { stateKey: 'suppliers', token: SuppliersResourceService },
];

function crudDelegations(
  resource: Type<unknown>,
  names: {
    load: ExplorerMethod;
    get: ExplorerMethod;
    add: ExplorerMethod;
    update: ExplorerMethod;
    remove: ExplorerMethod;
  },
  ids: readonly string[],
): Delegation[] {
  return [
    { method: names.load, args: [], resource, target: 'loadAll', expectedArgs: [] },
    { method: names.get, args: ids, resource, target: 'getById', expectedArgs: ids },
    {
      method: names.add,
      args: ['{"a":1}'],
      resource,
      target: 'addFromJson',
      expectedArgs: ['{"a":1}'],
    },
    {
      method: names.update,
      args: ['{"a":2}'],
      resource,
      target: 'updateFromJson',
      expectedArgs: ['{"a":2}'],
    },
    { method: names.remove, args: ids, resource, target: 'deleteById', expectedArgs: ids },
  ];
}

const DELEGATIONS: readonly Delegation[] = [
  ...crudDelegations(
    CategoriesResourceService,
    {
      load: 'loadCategories',
      get: 'getCategoryById',
      add: 'addCategory',
      update: 'updateCategory',
      remove: 'deleteCategory',
    },
    ['1'],
  ),
  ...crudDelegations(
    CustomersResourceService,
    {
      load: 'loadCustomers',
      get: 'getCustomerById',
      add: 'addCustomer',
      update: 'updateCustomer',
      remove: 'deleteCustomer',
    },
    ['ALFKI'],
  ),
  ...crudDelegations(
    EmployeesResourceService,
    {
      load: 'loadEmployees',
      get: 'getEmployeeById',
      add: 'addEmployee',
      update: 'updateEmployee',
      remove: 'deleteEmployee',
    },
    ['3'],
  ),
  ...crudDelegations(
    OrderDetailsResourceService,
    {
      load: 'loadOrderDetails',
      get: 'getOrderDetailById',
      add: 'addOrderDetail',
      update: 'updateOrderDetail',
      remove: 'deleteOrderDetail',
    },
    ['1', '10248'],
  ),
  ...crudDelegations(
    OrdersResourceService,
    {
      load: 'loadOrders',
      get: 'getOrderById',
      add: 'addOrder',
      update: 'updateOrder',
      remove: 'deleteOrder',
    },
    ['10248'],
  ),
  ...crudDelegations(
    ProductsResourceService,
    {
      load: 'loadProducts',
      get: 'getProductById',
      add: 'addProduct',
      update: 'updateProduct',
      remove: 'deleteProduct',
    },
    ['78'],
  ),
  ...crudDelegations(
    ShippersResourceService,
    {
      load: 'loadShippers',
      get: 'getShipperById',
      add: 'addShipper',
      update: 'updateShipper',
      remove: 'deleteShipper',
    },
    ['4'],
  ),
  ...crudDelegations(
    SuppliersResourceService,
    {
      load: 'loadSuppliers',
      get: 'getSupplierById',
      add: 'addSupplier',
      update: 'updateSupplier',
      remove: 'deleteSupplier',
    },
    ['30'],
  ),
  {
    method: 'runHealthcheck',
    args: [],
    resource: SystemResourceService,
    target: 'runHealthcheck',
    expectedArgs: [],
  },
  {
    method: 'runAbout',
    args: [],
    resource: SystemResourceService,
    target: 'runAbout',
    expectedArgs: [],
  },
];

function createCrudResourceDouble(): Record<string, unknown> {
  return {
    state: signal(initialResourcePanelState),
    loadAll: vi.fn(),
    getById: vi.fn(),
    addFromJson: vi.fn(),
    updateFromJson: vi.fn(),
    deleteById: vi.fn(),
  };
}

describe('ApiExplorerService', () => {
  let service: ApiExplorerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...CRUD_RESOURCES.map(({ token }) => ({
          provide: token,
          useValue: createCrudResourceDouble(),
        })),
        {
          provide: SystemResourceService,
          useValue: {
            state: signal(initialResourcePanelState),
            runHealthcheck: vi.fn(),
            runAbout: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(ApiExplorerService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  for (const { stateKey, token } of [
    ...CRUD_RESOURCES,
    { stateKey: 'system' as const, token: SystemResourceService },
  ]) {
    describe(stateKey, () => {
      it('exposes the state signal of the matching resource service', () => {
        const state = service[stateKey];

        expect(state).toBe((TestBed.inject(token) as { state: unknown }).state);
      });
    });
  }

  for (const { method, args, resource, target, expectedArgs } of DELEGATIONS) {
    describe(method, () => {
      it(`delegates to ${resource.name}.${target}`, () => {
        const resourceDouble = TestBed.inject(resource) as Record<string, ReturnType<typeof vi.fn>>;

        (service[method] as (...values: readonly string[]) => void)(...args);

        expect(resourceDouble[target]).toHaveBeenCalledExactlyOnceWith(...expectedArgs);
      });
    });
  }
});
