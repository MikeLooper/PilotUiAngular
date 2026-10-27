import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AddResponseInt, EmployeesDto } from '../generated';
import { EmployeesApiFacade } from './employees-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const RESOURCE_URL = 'http://localhost:53060/v1/employees';
const GET_ALL_URL = `${RESOURCE_URL}/get-all`;
const EMPLOYEE: EmployeesDto = { employeeId: 1, firstName: 'Nancy', lastName: 'Davolio' };
const NEW_EMPLOYEE: EmployeesDto = { firstName: 'Sample', lastName: 'Employee' };
const ADD_RESPONSE: AddResponseInt = { id: 10 };

describe('EmployeesApiFacade', () => {
  let facade: EmployeesApiFacade;
  let httpMock: HttpTestingController;

  /** Loads the list once so later calls can be checked against the cache. */
  async function primeCache(): Promise<void> {
    const loaded = lastValueFrom(facade.getAll());
    httpMock.expectOne(GET_ALL_URL).flush([EMPLOYEE]);
    await loaded;
  }

  beforeEach(() => {
    const context = setupFacadeTestbed(EmployeesApiFacade);
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
    it('requests all employees and emits the response', async () => {
      const result = lastValueFrom(facade.getAll());

      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([EMPLOYEE]);

      expect(await result).toEqual([EMPLOYEE]);
    });

    it('serves repeated calls from the cache', async () => {
      await primeCache();

      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual([EMPLOYEE]);
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
    it('requests the employee by id and emits it', async () => {
      const result = lastValueFrom(facade.getById(1));

      httpMock.expectOne({ method: 'GET', url: `${RESOURCE_URL}/get/1` }).flush(EMPLOYEE);

      expect(await result).toEqual(EMPLOYEE);
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
    it('posts the employee and emits the add response', async () => {
      const result = lastValueFrom(facade.add(NEW_EMPLOYEE));

      const request = httpMock.expectOne({ method: 'POST', url: `${RESOURCE_URL}/add` });
      request.flush(ADD_RESPONSE);

      expect(request.request.body).toEqual(NEW_EMPLOYEE);
      expect(await result).toEqual(ADD_RESPONSE);
    });

    it('clears the cached list', async () => {
      await primeCache();
      const added = lastValueFrom(facade.add(NEW_EMPLOYEE));
      httpMock.expectOne(`${RESOURCE_URL}/add`).flush(ADD_RESPONSE);
      await added;

      const reloaded = lastValueFrom(facade.getAll());
      httpMock.expectOne({ method: 'GET', url: GET_ALL_URL }).flush([EMPLOYEE, NEW_EMPLOYEE]);

      expect(await reloaded).toEqual([EMPLOYEE, NEW_EMPLOYEE]);
    });
  });

  describe('update', () => {
    it('puts the employee and emits undefined', async () => {
      const result = lastValueFrom(facade.update(EMPLOYEE));

      const request = httpMock.expectOne({ method: 'PUT', url: `${RESOURCE_URL}/update` });
      request.flush({});

      expect(request.request.body).toEqual(EMPLOYEE);
      expect(await result).toBeUndefined();
    });

    it('clears the cached list', async () => {
      await primeCache();
      const updated = lastValueFrom(facade.update(EMPLOYEE));
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
