export type ResourceRecord = Record<string, unknown>;

export interface ResourceDefinition {
  /** Route segment under /resources and under /v1 in the API. */
  readonly key: string;
  readonly navLabel: string;
  readonly heading: string;
  /** Record fields that identify a record, in the order they appear in API paths. */
  readonly idFields: readonly string[];
  /** Field the mock API assigns on create; resources without one take the ID from the body. */
  readonly generatedIdField?: string;
  readonly primaryIdLabel: string;
  readonly secondaryIdLabel?: string;
  /** The first record is the one the page's default IDs address. */
  readonly seed: readonly ResourceRecord[];
  /** List title of the first seeded record. */
  readonly defaultRecordTitle: string;
  /** List title of the first seeded record after the page's update sample is applied. */
  readonly updatedRecordTitle: string;
}

export const RESOURCES: readonly ResourceDefinition[] = [
  {
    key: 'categories',
    navLabel: 'Categories',
    heading: 'Categories API',
    idFields: ['categoryId'],
    generatedIdField: 'categoryId',
    primaryIdLabel: 'Category ID',
    seed: [
      { categoryId: 1, categoryName: 'Beverages', description: 'Soft drinks and teas' },
      { categoryId: 2, categoryName: 'Condiments', description: 'Sauces and spreads' },
    ],
    defaultRecordTitle: 'Beverages',
    updatedRecordTitle: 'Updated name',
  },
  {
    key: 'customers',
    navLabel: 'Customers',
    heading: 'Customers API',
    idFields: ['customerId'],
    primaryIdLabel: 'Customer ID',
    seed: [
      { customerId: 'ALFKI', companyName: 'Alfreds Futterkiste', city: 'Berlin' },
      { customerId: 'ANATR', companyName: 'Ana Trujillo', city: 'Mexico City' },
    ],
    defaultRecordTitle: 'Alfreds Futterkiste',
    updatedRecordTitle: 'Updated Customer Co',
  },
  {
    key: 'employees',
    navLabel: 'Employees',
    heading: 'Employees API',
    idFields: ['employeeId'],
    generatedIdField: 'employeeId',
    primaryIdLabel: 'Employee ID',
    seed: [
      { employeeId: 1, firstName: 'Nancy', lastName: 'Davolio', title: 'Sales' },
      { employeeId: 2, firstName: 'Andrew', lastName: 'Fuller', title: 'VP' },
    ],
    defaultRecordTitle: 'Nancy Davolio',
    updatedRecordTitle: 'Updated Employee',
  },
  {
    key: 'order-details',
    navLabel: 'Order Details',
    heading: 'Order Details API',
    idFields: ['productId', 'orderId'],
    primaryIdLabel: 'Product ID',
    secondaryIdLabel: 'Order ID',
    seed: [
      { productId: 1, orderId: 10248, unitPrice: 18, quantity: 5, discount: 0 },
      { productId: 2, orderId: 10248, unitPrice: 19, quantity: 7, discount: 0 },
    ],
    defaultRecordTitle: 'Order 10248 • Product 1',
    updatedRecordTitle: 'Order 10248 • Product 1',
  },
  {
    key: 'orders',
    navLabel: 'Orders',
    heading: 'Orders API',
    idFields: ['orderId'],
    generatedIdField: 'orderId',
    primaryIdLabel: 'Order ID',
    seed: [
      { orderId: 10248, customerId: 'ALFKI', shipCity: 'Berlin' },
      { orderId: 10249, customerId: 'ANATR', shipCity: 'Mexico City' },
    ],
    defaultRecordTitle: 'Order #10248',
    updatedRecordTitle: 'Order #10248',
  },
  {
    key: 'products',
    navLabel: 'Products',
    heading: 'Products API',
    idFields: ['productId'],
    generatedIdField: 'productId',
    primaryIdLabel: 'Product ID',
    seed: [
      { productId: 1, productName: 'Chai', quantityPerUnit: '10 boxes', unitPrice: 18 },
      { productId: 2, productName: 'Chang', quantityPerUnit: '24 bottles', unitPrice: 19 },
    ],
    defaultRecordTitle: 'Chai',
    updatedRecordTitle: 'Updated Product',
  },
  {
    key: 'shippers',
    navLabel: 'Shippers',
    heading: 'Shippers API',
    idFields: ['shipperId'],
    generatedIdField: 'shipperId',
    primaryIdLabel: 'Shipper ID',
    seed: [
      { shipperId: 1, companyName: 'Speedy Express', phone: '555-0001' },
      { shipperId: 2, companyName: 'United Package', phone: '555-0002' },
    ],
    defaultRecordTitle: 'Speedy Express',
    updatedRecordTitle: 'Updated Shipper',
  },
  {
    key: 'suppliers',
    navLabel: 'Suppliers',
    heading: 'Suppliers API',
    idFields: ['supplierId'],
    generatedIdField: 'supplierId',
    primaryIdLabel: 'Supplier ID',
    seed: [
      { supplierId: 1, companyName: 'Exotic Liquids', city: 'London' },
      { supplierId: 2, companyName: 'Tokyo Traders', city: 'Tokyo' },
    ],
    defaultRecordTitle: 'Exotic Liquids',
    updatedRecordTitle: 'Updated Supplier',
  },
];
