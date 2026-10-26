import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AddResponseInt, OrdersDto } from '../generated';
import { OrdersApiFacade } from './orders-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const RESOURCE_URL = 'http://localhost:53060/v1/orders';
const GET_ALL_URL = `${RESOURCE_URL}/get-all`;
const ORDER: OrdersDto = { orderId: 10248, customerId: 'VINET', shipCity: 'Reims' };
const NEW_ORDER: OrdersDto = { customerId: 'ALFKI', shipCity: 'Seattle' };
const ADD_RESPONSE: AddResponseInt = { id: 11078 };

describe('OrdersApiFacade', () => {
  let facade: OrdersApiFacade;
  let httpMock: HttpTestingController;

  /** Loads the list once so later calls can be checked against the cache. */
  async function primeCache(): Promise<void> {
    const loaded = lastValueFrom(facade.getAll());
    httpMock.expectOne(GET_ALL_URL).flush([ORDER]);
    await loaded;
  }

  beforeEach(() => {
    const context = setupFacadeTestbed(OrdersApiFacade);
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
    it('requests all orders and emits the response', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([ORDER]);

      expect(await result).toEqual([ORDER]);
    });

    it('serves repeated calls from the cache', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual([ORDER]);
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
    it('requests the order by id and emits it', async () => {
      const result = lastValueFrom(facade.getById(10248));

      httpMock.expectOne({ method: 'GET', url: `${RESOURCE_URL}/get/10248` }).flush(ORDER);

      expect(await result).toEqual(ORDER);
    });

    it('propagates HTTP errors to the caller', async () => {
      const result = lastValueFrom(facade.getById(10248));

      httpMock
        .expectOne(`${RESOURCE_URL}/get/10248`)
        .flush(null, { status: 404, statusText: 'Not Found' });

      await expect(result).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('add', () => {
    it('posts the order and emits the add response', async () => {
      const result = lastValueFrom(facade.add(NEW_ORDER));

      const request = httpMock.expectOne({ method: 'POST', url: `${RESOURCE_URL}/add` });
      request.flush(ADD_RESPONSE);

      expect(request.request.body).toEqual(NEW_ORDER);
      expect(await result).toEqual(ADD_RESPONSE);
    });

    it('clears the cached list', async () => {
      await primeCache();
      const added = lastValueFrom(facade.add(NEW_ORDER));
      httpMock.expectOne(`${RESOURCE_URL}/add`).flush(ADD_RESPONSE);
      await added;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([ORDER, NEW_ORDER]);

      expect(await reloaded).toEqual([ORDER, NEW_ORDER]);
    });
  });

  describe('update', () => {
    it('puts the order and emits undefined', async () => {
      const result = lastValueFrom(facade.update(ORDER));

      const request = httpMock.expectOne({ method: 'PUT', url: `${RESOURCE_URL}/update` });
      request.flush({});

      expect(request.request.body).toEqual(ORDER);
      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const updated = lastValueFrom(facade.update(ORDER));
      httpMock.expectOne(`${RESOURCE_URL}/update`).flush({});
      await updated;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });

  describe('delete', () => {
    it('sends a delete request for the id and emits undefined', async () => {
      const result = lastValueFrom(facade.delete(10248));

      httpMock.expectOne({ method: 'DELETE', url: `${RESOURCE_URL}/delete/10248` }).flush({});

      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const deleted = lastValueFrom(facade.delete(10248));
      httpMock.expectOne(`${RESOURCE_URL}/delete/10248`).flush({});
      await deleted;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });
});
