import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AddResponseString, CustomersDto } from '../generated';
import { CustomersApiFacade } from './customers-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const RESOURCE_URL = 'http://localhost:53060/v1/customers';
const GET_ALL_URL = `${RESOURCE_URL}/get-all`;
const CUSTOMER: CustomersDto = { customerId: 'ALFKI', companyName: 'Alfreds Futterkiste' };
const NEW_CUSTOMER: CustomersDto = { customerId: 'NEW01', companyName: 'New Co' };
const ADD_RESPONSE: AddResponseString = { id: 'NEW01' };

describe('CustomersApiFacade', () => {
  let facade: CustomersApiFacade;
  let httpMock: HttpTestingController;

  /** Loads the list once so later calls can be checked against the cache. */
  async function primeCache(): Promise<void> {
    const loaded = lastValueFrom(facade.getAll());
    httpMock.expectOne(GET_ALL_URL).flush([CUSTOMER]);
    await loaded;
  }

  beforeEach(() => {
    const context = setupFacadeTestbed(CustomersApiFacade);
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
    it('requests all customers and emits the response', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([CUSTOMER]);

      expect(await result).toEqual([CUSTOMER]);
    });

    it('serves repeated calls from the cache', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual([CUSTOMER]);
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
    it('requests the customer by id and emits it', async () => {
      const result = lastValueFrom(facade.getById('ALFKI'));

      httpMock.expectOne({ method: 'GET', url: `${RESOURCE_URL}/get/ALFKI` }).flush(CUSTOMER);

      expect(await result).toEqual(CUSTOMER);
    });

    it('propagates HTTP errors to the caller', async () => {
      const result = lastValueFrom(facade.getById('ALFKI'));

      httpMock
        .expectOne(`${RESOURCE_URL}/get/ALFKI`)
        .flush(null, { status: 404, statusText: 'Not Found' });

      await expect(result).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('add', () => {
    it('posts the customer and emits the add response', async () => {
      const result = lastValueFrom(facade.add(NEW_CUSTOMER));

      const request = httpMock.expectOne({ method: 'POST', url: `${RESOURCE_URL}/add` });
      request.flush(ADD_RESPONSE);

      expect(request.request.body).toEqual(NEW_CUSTOMER);
      expect(await result).toEqual(ADD_RESPONSE);
    });

    it('clears the cached list', async () => {
      await primeCache();
      const added = lastValueFrom(facade.add(NEW_CUSTOMER));
      httpMock.expectOne(`${RESOURCE_URL}/add`).flush(ADD_RESPONSE);
      await added;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([CUSTOMER, NEW_CUSTOMER]);

      expect(await reloaded).toEqual([CUSTOMER, NEW_CUSTOMER]);
    });
  });

  describe('update', () => {
    it('puts the customer and emits undefined', async () => {
      const result = lastValueFrom(facade.update(CUSTOMER));

      const request = httpMock.expectOne({ method: 'PUT', url: `${RESOURCE_URL}/update` });
      request.flush({});

      expect(request.request.body).toEqual(CUSTOMER);
      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const updated = lastValueFrom(facade.update(CUSTOMER));
      httpMock.expectOne(`${RESOURCE_URL}/update`).flush({});
      await updated;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });

  describe('delete', () => {
    it('sends a delete request for the id and emits undefined', async () => {
      const result = lastValueFrom(facade.delete('ALFKI'));

      httpMock.expectOne({ method: 'DELETE', url: `${RESOURCE_URL}/delete/ALFKI` }).flush({});

      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const deleted = lastValueFrom(facade.delete('ALFKI'));
      httpMock.expectOne(`${RESOURCE_URL}/delete/ALFKI`).flush({});
      await deleted;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });
});
