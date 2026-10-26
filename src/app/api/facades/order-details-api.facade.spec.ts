import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AddResponseOrderDetails, OrderDetailsDto } from '../generated';
import { OrderDetailsApiFacade } from './order-details-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const RESOURCE_URL = 'http://localhost:53060/v1/order-details';
const GET_ALL_URL = `${RESOURCE_URL}/get-all`;
const ORDER_DETAIL: OrderDetailsDto = {
  orderId: 10248,
  productId: 1,
  unitPrice: 18,
  quantity: 10,
  discount: 0,
};
const NEW_ORDER_DETAIL: OrderDetailsDto = {
  orderId: 10249,
  productId: 2,
  unitPrice: 19,
  quantity: 5,
  discount: 0.1,
};
const ADD_RESPONSE: AddResponseOrderDetails = { orderId: 10249, productId: 2 };

describe('OrderDetailsApiFacade', () => {
  let facade: OrderDetailsApiFacade;
  let httpMock: HttpTestingController;

  /** Loads the list once so later calls can be checked against the cache. */
  async function primeCache(): Promise<void> {
    const loaded = lastValueFrom(facade.getAll());
    httpMock.expectOne(GET_ALL_URL).flush([ORDER_DETAIL]);
    await loaded;
  }

  beforeEach(() => {
    const context = setupFacadeTestbed(OrderDetailsApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('getAll', () => {
    it('requests all order details and emits the response', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([ORDER_DETAIL]);

      expect(await result).toEqual([ORDER_DETAIL]);
    });

    it('serves repeated calls from the cache', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual([ORDER_DETAIL]);
      httpMock.expectNone(GET_ALL_URL);
    });

    it('requests the list again when forceRefresh is true', async () => {
      await primeCache();

      const result = lastValueFrom(facade.getAll(true));
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('requests the order detail by product and order id and emits it', async () => {
      const result = lastValueFrom(facade.getById(1, 10248));

      httpMock
        .expectOne({ method: 'GET', url: `${RESOURCE_URL}/get/product/1/order/10248` })
        .flush(ORDER_DETAIL);

      expect(await result).toEqual(ORDER_DETAIL);
    });

    it('propagates HTTP errors to the caller', async () => {
      const result = lastValueFrom(facade.getById(1, 10248));

      httpMock
        .expectOne(`${RESOURCE_URL}/get/product/1/order/10248`)
        .flush(null, { status: 404, statusText: 'Not Found' });

      await expect(result).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('add', () => {
    it('posts the order detail and emits the add response', async () => {
      const result = lastValueFrom(facade.add(NEW_ORDER_DETAIL));

      const request = httpMock.expectOne({ method: 'POST', url: `${RESOURCE_URL}/add` });
      request.flush(ADD_RESPONSE);

      expect(request.request.body).toEqual(NEW_ORDER_DETAIL);
      expect(await result).toEqual(ADD_RESPONSE);
    });

    it('clears the cached list', async () => {
      await primeCache();
      const added = lastValueFrom(facade.add(NEW_ORDER_DETAIL));
      httpMock.expectOne(`${RESOURCE_URL}/add`).flush(ADD_RESPONSE);
      await added;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock
        .expectOne({ method: 'GET', url: GET_ALL_URL })
        .flush([ORDER_DETAIL, NEW_ORDER_DETAIL]);

      expect(await reloaded).toEqual([ORDER_DETAIL, NEW_ORDER_DETAIL]);
    });
  });

  describe('update', () => {
    it('puts the order detail and emits undefined', async () => {
      const result = lastValueFrom(facade.update(ORDER_DETAIL));

      const request = httpMock.expectOne({ method: 'PUT', url: `${RESOURCE_URL}/update` });
      request.flush({});

      expect(request.request.body).toEqual(ORDER_DETAIL);
      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const updated = lastValueFrom(facade.update(ORDER_DETAIL));
      httpMock.expectOne(`${RESOURCE_URL}/update`).flush({});
      await updated;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });

  describe('delete', () => {
    it('sends a delete request for the product and order id and emits undefined', async () => {
      const result = lastValueFrom(facade.delete(1, 10248));

      httpMock
        .expectOne({ method: 'DELETE', url: `${RESOURCE_URL}/delete/product/1/order/10248` })
        .flush({});

      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const deleted = lastValueFrom(facade.delete(1, 10248));
      httpMock.expectOne(`${RESOURCE_URL}/delete/product/1/order/10248`).flush({});
      await deleted;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });
});
