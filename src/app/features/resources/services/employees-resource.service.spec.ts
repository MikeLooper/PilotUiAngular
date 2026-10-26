import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmployeesApiFacade } from '../../../api/facades/employees-api.facade';
import { EmployeesDto } from '../../../api/generated';
import { EmployeesResourceService } from './employees-resource.service';

const ITEM: EmployeesDto = { employeeId: 1, firstName: 'Nancy', lastName: 'Davolio' };

describe('EmployeesResourceService', () => {
  let service: EmployeesResourceService;
  let facade: Pick<EmployeesApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: EmployeesApiFacade, useValue: facade }],
    });
    service = TestBed.inject(EmployeesResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every employee with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one employee into the item result', () => {
      service.getById('1');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().itemResult).toEqual(ITEM);
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed employee', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Employees payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed employee', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the employee and records success', () => {
      service.deleteById('1');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().mutationResult).toEqual({ success: true });
    });
  });
});
