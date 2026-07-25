import { Injectable } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class ApiExplorerService {
  public readonly categories;
  public readonly customers;
  public readonly employees;
  public readonly orderDetails;
  public readonly orders;
  public readonly products;
  public readonly shippers;
  public readonly suppliers;
  public readonly system;

  public constructor(
    private readonly categoriesResource: CategoriesResourceService,
    private readonly customersResource: CustomersResourceService,
    private readonly employeesResource: EmployeesResourceService,
    private readonly orderDetailsResource: OrderDetailsResourceService,
    private readonly ordersResource: OrdersResourceService,
    private readonly productsResource: ProductsResourceService,
    private readonly shippersResource: ShippersResourceService,
    private readonly suppliersResource: SuppliersResourceService,
    private readonly systemResource: SystemResourceService
  ) {
    this.categories = this.categoriesResource.state;
    this.customers = this.customersResource.state;
    this.employees = this.employeesResource.state;
    this.orderDetails = this.orderDetailsResource.state;
    this.orders = this.ordersResource.state;
    this.products = this.productsResource.state;
    this.shippers = this.shippersResource.state;
    this.suppliers = this.suppliersResource.state;
    this.system = this.systemResource.state;
  }

  public loadCategories(): void {
    this.categoriesResource.loadAll();
  }

  public getCategoryById(categoryId: string): void {
    this.categoriesResource.getById(categoryId);
  }

  public addCategory(payload: string): void {
    this.categoriesResource.addFromJson(payload);
  }

  public updateCategory(payload: string): void {
    this.categoriesResource.updateFromJson(payload);
  }

  public deleteCategory(categoryId: string): void {
    this.categoriesResource.deleteById(categoryId);
  }

  public loadCustomers(): void {
    this.customersResource.loadAll();
  }

  public getCustomerById(customerId: string): void {
    this.customersResource.getById(customerId);
  }

  public addCustomer(payload: string): void {
    this.customersResource.addFromJson(payload);
  }

  public updateCustomer(payload: string): void {
    this.customersResource.updateFromJson(payload);
  }

  public deleteCustomer(customerId: string): void {
    this.customersResource.deleteById(customerId);
  }

  public loadEmployees(): void {
    this.employeesResource.loadAll();
  }

  public getEmployeeById(employeeId: string): void {
    this.employeesResource.getById(employeeId);
  }

  public addEmployee(payload: string): void {
    this.employeesResource.addFromJson(payload);
  }

  public updateEmployee(payload: string): void {
    this.employeesResource.updateFromJson(payload);
  }

  public deleteEmployee(employeeId: string): void {
    this.employeesResource.deleteById(employeeId);
  }

  public loadOrderDetails(): void {
    this.orderDetailsResource.loadAll();
  }

  public getOrderDetailById(productId: string, orderId: string): void {
    this.orderDetailsResource.getById(productId, orderId);
  }

  public addOrderDetail(payload: string): void {
    this.orderDetailsResource.addFromJson(payload);
  }

  public updateOrderDetail(payload: string): void {
    this.orderDetailsResource.updateFromJson(payload);
  }

  public deleteOrderDetail(productId: string, orderId: string): void {
    this.orderDetailsResource.deleteById(productId, orderId);
  }

  public loadOrders(): void {
    this.ordersResource.loadAll();
  }

  public getOrderById(orderId: string): void {
    this.ordersResource.getById(orderId);
  }

  public addOrder(payload: string): void {
    this.ordersResource.addFromJson(payload);
  }

  public updateOrder(payload: string): void {
    this.ordersResource.updateFromJson(payload);
  }

  public deleteOrder(orderId: string): void {
    this.ordersResource.deleteById(orderId);
  }

  public loadProducts(): void {
    this.productsResource.loadAll();
  }

  public getProductById(productId: string): void {
    this.productsResource.getById(productId);
  }

  public addProduct(payload: string): void {
    this.productsResource.addFromJson(payload);
  }

  public updateProduct(payload: string): void {
    this.productsResource.updateFromJson(payload);
  }

  public deleteProduct(productId: string): void {
    this.productsResource.deleteById(productId);
  }

  public loadShippers(): void {
    this.shippersResource.loadAll();
  }

  public getShipperById(shipperId: string): void {
    this.shippersResource.getById(shipperId);
  }

  public addShipper(payload: string): void {
    this.shippersResource.addFromJson(payload);
  }

  public updateShipper(payload: string): void {
    this.shippersResource.updateFromJson(payload);
  }

  public deleteShipper(shipperId: string): void {
    this.shippersResource.deleteById(shipperId);
  }

  public loadSuppliers(): void {
    this.suppliersResource.loadAll();
  }

  public getSupplierById(supplierId: string): void {
    this.suppliersResource.getById(supplierId);
  }

  public addSupplier(payload: string): void {
    this.suppliersResource.addFromJson(payload);
  }

  public updateSupplier(payload: string): void {
    this.suppliersResource.updateFromJson(payload);
  }

  public deleteSupplier(supplierId: string): void {
    this.suppliersResource.deleteById(supplierId);
  }

  public runHealthcheck(): void {
    this.systemResource.runHealthcheck();
  }

  public runAbout(): void {
    this.systemResource.runAbout();
  }
}

export type { ResourcePanelState } from '../../resources/services/resources-services';
