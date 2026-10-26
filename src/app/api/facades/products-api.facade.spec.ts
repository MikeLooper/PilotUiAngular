import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AddResponseInt, ProductsDto } from '../generated';
import { ProductsApiFacade } from './products-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const RESOURCE_URL = 'http://localhost:53060/v1/products';
const GET_ALL_URL = `${RESOURCE_URL}/get-all`;
const PRODUCT: ProductsDto = { productId: 1, productName: 'Chai' };
const NEW_PRODUCT: ProductsDto = { productName: 'Sample Product' };
const ADD_RESPONSE: AddResponseInt = { id: 78 };

describe('ProductsApiFacade', () => {
  let facade: ProductsApiFacade;
  let httpMock: HttpTestingController;

  /** Loads the list once so later calls can be checked against the cache. */
  async function primeCache(): Promise<void> {
    const loaded = lastValueFrom(facade.getAll());
    httpMock.expectOne(GET_ALL_URL).flush([PRODUCT]);
    await loaded;
  }

  beforeEach(() => {
    const context = setupFacadeTestbed(ProductsApiFacade);
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
    it('requests all products and emits the response', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([PRODUCT]);

      expect(await result).toEqual([PRODUCT]);
    });

    it('serves repeated calls from the cache', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual([PRODUCT]);
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
    it('requests the product by id and emits it', async () => {
      const result = lastValueFrom(facade.getById(1));

      httpMock.expectOne({ method: 'GET', url: `${RESOURCE_URL}/get/1` }).flush(PRODUCT);

      expect(await result).toEqual(PRODUCT);
    });

    it('propagates HTTP errors to the caller', async () => {
      const result = lastValueFrom(facade.getById(1));

      httpMock
        .expectOne(`${RESOURCE_URL}/get/1`)
        .flush(null, { status: 404, statusText: 'Not Found' });

      await expect(result).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('add', () => {
    it('posts the product and emits the add response', async () => {
      const result = lastValueFrom(facade.add(NEW_PRODUCT));

      const request = httpMock.expectOne({ method: 'POST', url: `${RESOURCE_URL}/add` });
      request.flush(ADD_RESPONSE);

      expect(request.request.body).toEqual(NEW_PRODUCT);
      expect(await result).toEqual(ADD_RESPONSE);
    });

    it('clears the cached list', async () => {
      await primeCache();
      const added = lastValueFrom(facade.add(NEW_PRODUCT));
      httpMock.expectOne(`${RESOURCE_URL}/add`).flush(ADD_RESPONSE);
      await added;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([PRODUCT, NEW_PRODUCT]);

      expect(await reloaded).toEqual([PRODUCT, NEW_PRODUCT]);
    });
  });

  describe('update', () => {
    it('puts the product and emits undefined', async () => {
      const result = lastValueFrom(facade.update(PRODUCT));

      const request = httpMock.expectOne({ method: 'PUT', url: `${RESOURCE_URL}/update` });
      request.flush({});

      expect(request.request.body).toEqual(PRODUCT);
      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const updated = lastValueFrom(facade.update(PRODUCT));
      httpMock.expectOne(`${RESOURCE_URL}/update`).flush({});
      await updated;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });

  describe('delete', () => {
    it('sends a delete request for the id and emits undefined', async () => {
      const result = lastValueFrom(facade.delete(1));

      httpMock.expectOne({ method: 'DELETE', url: `${RESOURCE_URL}/delete/1` }).flush({});

      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const deleted = lastValueFrom(facade.delete(1));
      httpMock.expectOne(`${RESOURCE_URL}/delete/1`).flush({});
      await deleted;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });
});
