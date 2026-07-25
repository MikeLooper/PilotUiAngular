import { Injectable } from '@angular/core';
import { CategoriesResourceVmFacade } from './categories-resource-vm.facade';
import { CustomersResourceVmFacade } from './customers-resource-vm.facade';
import { EmployeesResourceVmFacade } from './employees-resource-vm.facade';
import { OrderDetailsResourceVmFacade } from './order-details-resource-vm.facade';
import { OrdersResourceVmFacade } from './orders-resource-vm.facade';
import { ProductsResourceVmFacade } from './products-resource-vm.facade';
import { ShippersResourceVmFacade } from './shippers-resource-vm.facade';
import { SuppliersResourceVmFacade } from './suppliers-resource-vm.facade';
import { SystemResourceVmFacade } from './system-resource-vm.facade';
import { ResourceCrudVmFacade, ResourceKey, SystemVmFacade } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class ResourceVmRegistryService {
  public constructor(
    private readonly categoriesFacade: CategoriesResourceVmFacade,
    private readonly customersFacade: CustomersResourceVmFacade,
    private readonly employeesFacade: EmployeesResourceVmFacade,
    private readonly orderDetailsFacade: OrderDetailsResourceVmFacade,
    private readonly ordersFacade: OrdersResourceVmFacade,
    private readonly productsFacade: ProductsResourceVmFacade,
    private readonly shippersFacade: ShippersResourceVmFacade,
    private readonly suppliersFacade: SuppliersResourceVmFacade,
    private readonly systemFacade: SystemResourceVmFacade
  ) {}

  public getCrudFacade(key: ResourceKey): ResourceCrudVmFacade | null {
    switch (key) {
      case 'categories':
        return this.categoriesFacade;
      case 'customers':
        return this.customersFacade;
      case 'employees':
        return this.employeesFacade;
      case 'order-details':
        return this.orderDetailsFacade;
      case 'orders':
        return this.ordersFacade;
      case 'products':
        return this.productsFacade;
      case 'shippers':
        return this.shippersFacade;
      case 'suppliers':
        return this.suppliersFacade;
      default:
        return null;
    }
  }

  public getSystemFacade(): SystemVmFacade {
    return this.systemFacade;
  }
}
