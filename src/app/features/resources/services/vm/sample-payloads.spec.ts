import { HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import {
  expectPost,
  expectPut,
  setupFacadeTestbed,
} from '../../../../api/facades/testing/setup-facade-testbed';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { CategoriesResourceVmFacade } from './categories-resource-vm.facade';
import { CustomersResourceVmFacade } from './customers-resource-vm.facade';
import { EmployeesResourceVmFacade } from './employees-resource-vm.facade';
import { OrderDetailsResourceVmFacade } from './order-details-resource-vm.facade';
import { OrdersResourceVmFacade } from './orders-resource-vm.facade';
import { ProductsResourceVmFacade } from './products-resource-vm.facade';
import { ShippersResourceVmFacade } from './shippers-resource-vm.facade';
import { SuppliersResourceVmFacade } from './suppliers-resource-vm.facade';

const rootUrl = 'http://localhost:53060';

interface SamplePayloadCase {
  readonly name: string;
  readonly facadeType: Type<BaseResourceCrudVmFacade<unknown>>;
  readonly resourcePath: string;
  /** Server-generated identifier that must not be sent on add (spec minimum is 1). */
  readonly generatedIdField?: string;
  /** String length limits from PilotApi_v1.yaml for fields the samples populate. */
  readonly maxLengths: Readonly<Record<string, number>>;
}

const cases: readonly SamplePayloadCase[] = [
  {
    name: 'categories',
    facadeType: CategoriesResourceVmFacade,
    resourcePath: 'categories',
    generatedIdField: 'categoryId',
    maxLengths: { categoryName: 15 },
  },
  {
    name: 'customers',
    facadeType: CustomersResourceVmFacade,
    resourcePath: 'customers',
    maxLengths: { customerId: 5, companyName: 40, contactName: 30, city: 15, country: 15 },
  },
  {
    name: 'employees',
    facadeType: EmployeesResourceVmFacade,
    resourcePath: 'employees',
    generatedIdField: 'employeeId',
    maxLengths: { firstName: 10, lastName: 20, title: 30, city: 15, country: 15 },
  },
  {
    name: 'order-details',
    facadeType: OrderDetailsResourceVmFacade,
    resourcePath: 'order-details',
    maxLengths: {},
  },
  {
    name: 'orders',
    facadeType: OrdersResourceVmFacade,
    resourcePath: 'orders',
    generatedIdField: 'orderId',
    maxLengths: { customerId: 5, shipCity: 15, shipCountry: 15 },
  },
  {
    name: 'products',
    facadeType: ProductsResourceVmFacade,
    resourcePath: 'products',
    generatedIdField: 'productId',
    maxLengths: { productName: 40 },
  },
  {
    name: 'shippers',
    facadeType: ShippersResourceVmFacade,
    resourcePath: 'shippers',
    generatedIdField: 'shipperId',
    maxLengths: { companyName: 40, phone: 24 },
  },
  {
    name: 'suppliers',
    facadeType: SuppliersResourceVmFacade,
    resourcePath: 'suppliers',
    generatedIdField: 'supplierId',
    maxLengths: { companyName: 40, contactName: 30, city: 15, country: 15 },
  },
];

function expectWithinMaxLengths(
  body: Record<string, unknown>,
  maxLengths: Readonly<Record<string, number>>,
): void {
  for (const [field, maxLength] of Object.entries(maxLengths)) {
    const value = body[field];
    if (typeof value === 'string') {
      expect(value.length, `${field} length`).toBeLessThanOrEqual(maxLength);
    }
  }
}

function flushReload(httpMock: HttpTestingController, resourcePath: string): void {
  httpMock
    .match((request) => request.url === `${rootUrl}/v1/${resourcePath}/get-all`)
    .forEach((request) => request.flush([]));
}

describe('Resource VM sample payloads', () => {
  let httpMock: HttpTestingController;

  afterEach(() => {
    httpMock.verify();
  });

  for (const testCase of cases) {
    describe(testCase.name, () => {
      let facade: BaseResourceCrudVmFacade<unknown>;

      beforeEach(() => {
        const context = setupFacadeTestbed(testCase.facadeType, rootUrl);
        facade = context.facade;
        httpMock = context.httpMock;
      });

      it('sends an add payload that satisfies the OpenAPI constraints', () => {
        facade.createSample();

        const request = expectPost(httpMock, `${rootUrl}/v1/${testCase.resourcePath}/add`);
        const body = request.request.body as Record<string, unknown>;

        if (testCase.generatedIdField) {
          expect(body).not.toHaveProperty(testCase.generatedIdField);
        }
        expectWithinMaxLengths(body, testCase.maxLengths);

        request.flush({ id: 1 });
        flushReload(httpMock, testCase.resourcePath);
      });

      it('sends an update payload that satisfies the OpenAPI constraints', () => {
        facade.updateSample();

        const request = expectPut(httpMock, `${rootUrl}/v1/${testCase.resourcePath}/update`);
        const body = request.request.body as Record<string, unknown>;

        expectWithinMaxLengths(body, testCase.maxLengths);

        request.flush(null);
        flushReload(httpMock, testCase.resourcePath);
      });
    });
  }

  describe('order-details numeric ranges', () => {
    let facade: OrderDetailsResourceVmFacade;

    beforeEach(() => {
      const context = setupFacadeTestbed(OrderDetailsResourceVmFacade, rootUrl);
      facade = context.facade;
      httpMock = context.httpMock;
    });

    it('keeps quantity at least 1 and discount between 0 and 1 in the add payload', () => {
      facade.createSample();

      const request = expectPost(httpMock, `${rootUrl}/v1/order-details/add`);
      const body = request.request.body as { quantity: number; discount: number };

      expect(body.quantity).toBeGreaterThanOrEqual(1);
      expect(body.discount).toBeGreaterThanOrEqual(0);
      expect(body.discount).toBeLessThanOrEqual(1);

      request.flush({ id: 1 });
      flushReload(httpMock, 'order-details');
    });

    it('keeps quantity at least 1 and discount between 0 and 1', () => {
      facade.updateSample();

      const request = expectPut(httpMock, `${rootUrl}/v1/order-details/update`);
      const body = request.request.body as { quantity: number; discount: number };

      expect(body.quantity).toBeGreaterThanOrEqual(1);
      expect(body.discount).toBeGreaterThanOrEqual(0);
      expect(body.discount).toBeLessThanOrEqual(1);

      request.flush(null);
      flushReload(httpMock, 'order-details');
    });
  });
});
