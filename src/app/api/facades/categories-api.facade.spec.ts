import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AddResponseInt, CategoriesDto } from '../generated';
import { CategoriesApiFacade } from './categories-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const RESOURCE_URL = 'http://localhost:53060/v1/categories';
const GET_ALL_URL = `${RESOURCE_URL}/get-all`;
const CATEGORY: CategoriesDto = {
  categoryId: 1,
  categoryName: 'Beverages',
  description: 'Soft drinks',
};
const NEW_CATEGORY: CategoriesDto = { categoryName: 'Snacks', description: 'Crunchy things' };
const ADD_RESPONSE: AddResponseInt = { id: 9 };

describe('CategoriesApiFacade', () => {
  let facade: CategoriesApiFacade;
  let httpMock: HttpTestingController;

  /** Loads the list once so later calls can be checked against the cache. */
  async function primeCache(): Promise<void> {
    const loaded = lastValueFrom(facade.getAllDtos());
    httpMock.expectOne(GET_ALL_URL).flush([CATEGORY]);
    await loaded;
  }

  beforeEach(() => {
    const context = setupFacadeTestbed(CategoriesApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('getAllDtos', () => {
    it('requests all categories and emits the response', async () => {
      const result = lastValueFrom(facade.getAllDtos());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([CATEGORY]);

      expect(await result).toEqual([CATEGORY]);
    });

    it('serves repeated calls from the cache', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAllDtos());

      expect(result).toEqual([CATEGORY]);
      httpMock.expectNone(GET_ALL_URL);
    });

    it('requests the list again when forceRefresh is true', async () => {
      await primeCache();

      const result = lastValueFrom(facade.getAllDtos(true));
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await result).toEqual([]);
    });
  });

  describe('getAll', () => {
    it('maps the API DTOs into category list items', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([CATEGORY]);

      expect(await result).toEqual([{ id: 1, name: 'Beverages', description: 'Soft drinks' }]);
    });

    it('returns an empty list when the API responds with no items', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await result).toEqual([]);
    });

    it('shares the cache used by getAllDtos', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAll());

      expect(result).toHaveLength(1);
      httpMock.expectNone(GET_ALL_URL);
    });
  });

  describe('getById', () => {
    it('requests the category by id and emits it', async () => {
      const result = lastValueFrom(facade.getById(1));

      httpMock.expectOne({ method: 'GET', url: `${RESOURCE_URL}/get/1` }).flush(CATEGORY);

      expect(await result).toEqual(CATEGORY);
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
    it('posts the category and emits the add response', async () => {
      const result = lastValueFrom(facade.add(NEW_CATEGORY));

      const request = httpMock.expectOne({ method: 'POST', url: `${RESOURCE_URL}/add` });
      request.flush(ADD_RESPONSE);

      expect(request.request.body).toEqual(NEW_CATEGORY);
      expect(await result).toEqual(ADD_RESPONSE);
    });

    it('clears the cached list', async () => {
      await primeCache();
      const added = lastValueFrom(facade.add(NEW_CATEGORY));
      httpMock.expectOne(`${RESOURCE_URL}/add`).flush(ADD_RESPONSE);
      await added;

      const reloaded = lastValueFrom(facade.getAllDtos());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([CATEGORY, NEW_CATEGORY]);

      expect(await reloaded).toEqual([CATEGORY, NEW_CATEGORY]);
    });
  });

  describe('update', () => {
    it('puts the category and emits undefined', async () => {
      const result = lastValueFrom(facade.update(CATEGORY));

      const request = httpMock.expectOne({ method: 'PUT', url: `${RESOURCE_URL}/update` });
      request.flush({});

      expect(request.request.body).toEqual(CATEGORY);
      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const updated = lastValueFrom(facade.update(CATEGORY));
      httpMock.expectOne(`${RESOURCE_URL}/update`).flush({});
      await updated;

      const reloaded = lastValueFrom(facade.getAllDtos());
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

      const reloaded = lastValueFrom(facade.getAllDtos());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([]);

      expect(await reloaded).toEqual([]);
    });
  });
});
