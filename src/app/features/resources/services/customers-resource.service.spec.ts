import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CustomersApiFacade } from '../../../api/facades/customers-api.facade';
import { CustomersDto } from '../../../api/generated';
import { CustomersResourceService } from './customers-resource.service';

const ITEM: CustomersDto = { customerId: 'ALFKI', companyName: 'Alfreds Futterkiste' };

describe('CustomersResourceService', () => {
  let service: CustomersResourceService;
  let facade: Pick<CustomersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 'ALFKI' })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CustomersApiFacade, useValue: facade }],
    });
    service = TestBed.inject(CustomersResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every customer with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one customer into the item result', () => {
      service.getById('ALFKI');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith('ALFKI');
      expect(service.state().itemResult).toEqual(ITEM);
    });

    it('passes numeric-looking ids to the facade as strings', () => {
      service.getById('42');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith('42');
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed customer', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Customers payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed customer', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the customer and records success', () => {
      service.deleteById('ALFKI');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith('ALFKI');
      expect(service.state().mutationResult).toEqual({ success: true });
    });

    it('passes numeric-looking ids to the facade as strings', () => {
      service.deleteById('42');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith('42');
    });
  });
});
