import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CategoriesResourceVmFacade } from './categories-resource-vm.facade';
import { CustomersResourceVmFacade } from './customers-resource-vm.facade';
import { EmployeesResourceVmFacade } from './employees-resource-vm.facade';
import { OrderDetailsResourceVmFacade } from './order-details-resource-vm.facade';
import { OrdersResourceVmFacade } from './orders-resource-vm.facade';
import { ProductsResourceVmFacade } from './products-resource-vm.facade';
import { ResourceVmRegistryService } from './resource-vm-registry.service';
import { ResourceKey } from './resource-vm.models';
import { ShippersResourceVmFacade } from './shippers-resource-vm.facade';
import { SuppliersResourceVmFacade } from './suppliers-resource-vm.facade';
import { SystemResourceVmFacade } from './system-resource-vm.facade';

const CRUD_FACADES: ReadonlyArray<{ key: ResourceKey; token: Type<unknown> }> = [
  { key: 'categories', token: CategoriesResourceVmFacade },
  { key: 'customers', token: CustomersResourceVmFacade },
  { key: 'employees', token: EmployeesResourceVmFacade },
  { key: 'order-details', token: OrderDetailsResourceVmFacade },
  { key: 'orders', token: OrdersResourceVmFacade },
  { key: 'products', token: ProductsResourceVmFacade },
  { key: 'shippers', token: ShippersResourceVmFacade },
  { key: 'suppliers', token: SuppliersResourceVmFacade },
];

describe('ResourceVmRegistryService', () => {
  let registry: ResourceVmRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...CRUD_FACADES.map(({ key, token }) => ({ provide: token, useValue: { key } })),
        { provide: SystemResourceVmFacade, useValue: { key: 'system' } },
      ],
    });
    registry = TestBed.inject(ResourceVmRegistryService);
  });

  it('creates the registry', () => {
    expect(registry).toBeTruthy();
  });

  describe('getCrudFacade', () => {
    it.each(CRUD_FACADES)('returns the $key facade', ({ key, token }) => {
      const facade = registry.getCrudFacade(key);

      expect(facade).toBe(TestBed.inject(token));
    });

    it('returns null for the system resource', () => {
      const facade = registry.getCrudFacade('system');

      expect(facade).toBeNull();
    });
  });

  describe('getSystemFacade', () => {
    it('returns the system facade', () => {
      const facade = registry.getSystemFacade();

      expect(facade).toBe(TestBed.inject(SystemResourceVmFacade));
    });
  });
});
