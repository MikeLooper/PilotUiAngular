import { JsonPipe } from '@angular/common';
import { Component, Signal, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ApiExplorerService, ResourcePanelState } from '../../services/api-explorer';

interface CrudFormState {
  getId: string;
  getSecondId: string;
  deleteId: string;
  deleteSecondId: string;
  addPayload: string;
  updatePayload: string;
}

interface CrudSectionConfig {
  readonly key: string;
  readonly title: string;
  readonly idLabel: string;
  readonly secondIdLabel?: string;
  readonly state: Signal<ResourcePanelState>;
  readonly form: CrudFormState;
  readonly loadAll: () => void;
  readonly getById: (id: string, id2?: string) => void;
  readonly add: (payload: string) => void;
  readonly update: (payload: string) => void;
  readonly delete: (id: string, id2?: string) => void;
}

@Component({
  selector: 'app-api-explorer',
  imports: [FormsModule, JsonPipe, ButtonComponent],
  templateUrl: './api-explorer.html',
  styleUrl: './api-explorer.scss',
})
export class ApiExplorerComponent {
  private readonly apiExplorerService = inject(ApiExplorerService);

  public readonly resourceKey = input<string | null>(null);
  public readonly showHeader = input(true);
  public readonly showNavigation = input(true);

  protected readonly sections: readonly CrudSectionConfig[] = [
    {
      key: 'categories',
      title: 'Categories',
      idLabel: 'Category ID',
      state: this.apiExplorerService.categories,
      form: {
        getId: '1',
        getSecondId: '',
        deleteId: '1',
        deleteSecondId: '',
        addPayload:
          '{\n  "categoryID": 0,\n  "categoryName": "New category",\n  "description": "Description",\n  "picture": null\n}',
        updatePayload:
          '{\n  "categoryID": 1,\n  "categoryName": "Updated category",\n  "description": "Updated description",\n  "picture": null\n}',
      },
      loadAll: () => this.apiExplorerService.loadCategories(),
      getById: (id) => this.apiExplorerService.getCategoryById(id),
      add: (payload) => this.apiExplorerService.addCategory(payload),
      update: (payload) => this.apiExplorerService.updateCategory(payload),
      delete: (id) => this.apiExplorerService.deleteCategory(id),
    },
    {
      key: 'customers',
      title: 'Customers',
      idLabel: 'Customer ID',
      state: this.apiExplorerService.customers,
      form: {
        getId: 'ALFKI',
        getSecondId: '',
        deleteId: 'ALFKI',
        deleteSecondId: '',
        addPayload:
          '{\n  "customerID": "NEW01",\n  "companyName": "New Company",\n  "contactName": "Jane Doe",\n  "contactTitle": "Owner",\n  "address": "1 Main St",\n  "city": "Seattle",\n  "region": null,\n  "postalCode": "98101",\n  "country": "USA",\n  "phone": "555-0100",\n  "fax": null\n}',
        updatePayload:
          '{\n  "customerID": "ALFKI",\n  "companyName": "Updated Company",\n  "contactName": "Maria Anders",\n  "contactTitle": "Sales",\n  "address": "Obere Str. 57",\n  "city": "Berlin",\n  "region": null,\n  "postalCode": "12209",\n  "country": "Germany",\n  "phone": "030-0074321",\n  "fax": "030-0076545"\n}',
      },
      loadAll: () => this.apiExplorerService.loadCustomers(),
      getById: (id) => this.apiExplorerService.getCustomerById(id),
      add: (payload) => this.apiExplorerService.addCustomer(payload),
      update: (payload) => this.apiExplorerService.updateCustomer(payload),
      delete: (id) => this.apiExplorerService.deleteCustomer(id),
    },
    {
      key: 'employees',
      title: 'Employees',
      idLabel: 'Employee ID',
      state: this.apiExplorerService.employees,
      form: {
        getId: '1',
        getSecondId: '',
        deleteId: '10',
        deleteSecondId: '',
        addPayload:
          '{\n  "employeeID": 0,\n  "lastName": "Doe",\n  "firstName": "John",\n  "title": "Developer",\n  "titleOfCourtesy": "Mr.",\n  "birthDate": null,\n  "hireDate": null,\n  "address": "1 Main St",\n  "city": "Seattle",\n  "region": null,\n  "postalCode": "98101",\n  "country": "USA",\n  "homePhone": "555-0123",\n  "extension": "123",\n  "photo": null,\n  "notes": null,\n  "reportsTo": null,\n  "photoPath": null\n}',
        updatePayload:
          '{\n  "employeeID": 1,\n  "lastName": "Davolio",\n  "firstName": "Nancy",\n  "title": "Sales Representative",\n  "titleOfCourtesy": "Ms.",\n  "address": "507 - 20th Ave.",\n  "city": "Seattle",\n  "region": "WA",\n  "postalCode": "98122",\n  "country": "USA"\n}',
      },
      loadAll: () => this.apiExplorerService.loadEmployees(),
      getById: (id) => this.apiExplorerService.getEmployeeById(id),
      add: (payload) => this.apiExplorerService.addEmployee(payload),
      update: (payload) => this.apiExplorerService.updateEmployee(payload),
      delete: (id) => this.apiExplorerService.deleteEmployee(id),
    },
    {
      key: 'order-details',
      title: 'Order Details',
      idLabel: 'Product ID',
      secondIdLabel: 'Order ID',
      state: this.apiExplorerService.orderDetails,
      form: {
        getId: '1',
        getSecondId: '10248',
        deleteId: '1',
        deleteSecondId: '10248',
        addPayload:
          '{\n  "orderID": 10248,\n  "productID": 1,\n  "unitPrice": 18.0,\n  "quantity": 10,\n  "discount": 0\n}',
        updatePayload:
          '{\n  "orderID": 10248,\n  "productID": 1,\n  "unitPrice": 18.0,\n  "quantity": 12,\n  "discount": 0.1\n}',
      },
      loadAll: () => this.apiExplorerService.loadOrderDetails(),
      getById: (id, id2) => this.apiExplorerService.getOrderDetailById(id, id2 || ''),
      add: (payload) => this.apiExplorerService.addOrderDetail(payload),
      update: (payload) => this.apiExplorerService.updateOrderDetail(payload),
      delete: (id, id2) => this.apiExplorerService.deleteOrderDetail(id, id2 || ''),
    },
    {
      key: 'orders',
      title: 'Orders',
      idLabel: 'Order ID',
      state: this.apiExplorerService.orders,
      form: {
        getId: '10248',
        getSecondId: '',
        deleteId: '11077',
        deleteSecondId: '',
        addPayload:
          '{\n  "orderID": 0,\n  "customerID": "ALFKI",\n  "employeeID": 1,\n  "orderDate": "2026-01-01T00:00:00",\n  "requiredDate": null,\n  "shippedDate": null,\n  "shipVia": 1,\n  "freight": 10.5,\n  "shipName": "Acme",\n  "shipAddress": "123 Ship St",\n  "shipCity": "Seattle",\n  "shipRegion": null,\n  "shipPostalCode": "98101",\n  "shipCountry": "USA"\n}',
        updatePayload:
          '{\n  "orderID": 10248,\n  "customerID": "ALFKI",\n  "employeeID": 1,\n  "shipCity": "Portland",\n  "shipCountry": "USA"\n}',
      },
      loadAll: () => this.apiExplorerService.loadOrders(),
      getById: (id) => this.apiExplorerService.getOrderById(id),
      add: (payload) => this.apiExplorerService.addOrder(payload),
      update: (payload) => this.apiExplorerService.updateOrder(payload),
      delete: (id) => this.apiExplorerService.deleteOrder(id),
    },
    {
      key: 'products',
      title: 'Products',
      idLabel: 'Product ID',
      state: this.apiExplorerService.products,
      form: {
        getId: '1',
        getSecondId: '',
        deleteId: '78',
        deleteSecondId: '',
        addPayload:
          '{\n  "productID": 0,\n  "productName": "New Product",\n  "supplierID": 1,\n  "categoryID": 1,\n  "quantityPerUnit": "10 boxes",\n  "unitPrice": 20.0,\n  "unitsInStock": 25,\n  "unitsOnOrder": 0,\n  "reorderLevel": 5,\n  "discontinued": false\n}',
        updatePayload:
          '{\n  "productID": 1,\n  "productName": "Updated Product",\n  "unitPrice": 24.5,\n  "unitsInStock": 18,\n  "discontinued": false\n}',
      },
      loadAll: () => this.apiExplorerService.loadProducts(),
      getById: (id) => this.apiExplorerService.getProductById(id),
      add: (payload) => this.apiExplorerService.addProduct(payload),
      update: (payload) => this.apiExplorerService.updateProduct(payload),
      delete: (id) => this.apiExplorerService.deleteProduct(id),
    },
    {
      key: 'shippers',
      title: 'Shippers',
      idLabel: 'Shipper ID',
      state: this.apiExplorerService.shippers,
      form: {
        getId: '1',
        getSecondId: '',
        deleteId: '4',
        deleteSecondId: '',
        addPayload:
          '{\n  "shipperID": 0,\n  "companyName": "Fast Freight",\n  "phone": "555-4444"\n}',
        updatePayload:
          '{\n  "shipperID": 1,\n  "companyName": "Speedy Express",\n  "phone": "555-3333"\n}',
      },
      loadAll: () => this.apiExplorerService.loadShippers(),
      getById: (id) => this.apiExplorerService.getShipperById(id),
      add: (payload) => this.apiExplorerService.addShipper(payload),
      update: (payload) => this.apiExplorerService.updateShipper(payload),
      delete: (id) => this.apiExplorerService.deleteShipper(id),
    },
    {
      key: 'suppliers',
      title: 'Suppliers',
      idLabel: 'Supplier ID',
      state: this.apiExplorerService.suppliers,
      form: {
        getId: '1',
        getSecondId: '',
        deleteId: '30',
        deleteSecondId: '',
        addPayload:
          '{\n  "supplierID": 0,\n  "companyName": "Supplier One",\n  "contactName": "Ada",\n  "contactTitle": "Manager",\n  "address": "42 Supply Ave",\n  "city": "Seattle",\n  "region": null,\n  "postalCode": "98101",\n  "country": "USA",\n  "phone": "555-0110",\n  "fax": null,\n  "homePage": null\n}',
        updatePayload:
          '{\n  "supplierID": 1,\n  "companyName": "Updated Supplier",\n  "contactName": "Exotic Liquids",\n  "phone": "555-0111"\n}',
      },
      loadAll: () => this.apiExplorerService.loadSuppliers(),
      getById: (id) => this.apiExplorerService.getSupplierById(id),
      add: (payload) => this.apiExplorerService.addSupplier(payload),
      update: (payload) => this.apiExplorerService.updateSupplier(payload),
      delete: (id) => this.apiExplorerService.deleteSupplier(id),
    },
  ];

  protected readonly healthState = this.apiExplorerService.system;
  protected readonly visibleSections = computed(() => {
    const key = this.resourceKey();
    if (!key || key === 'system') {
      return this.sections;
    }

    return this.sections.filter((section) => section.key === key);
  });

  protected runHealthcheck(): void {
    this.apiExplorerService.runHealthcheck();
  }

  protected runAbout(): void {
    this.apiExplorerService.runAbout();
  }
}
