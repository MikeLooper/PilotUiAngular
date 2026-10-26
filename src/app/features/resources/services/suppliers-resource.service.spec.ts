import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SuppliersApiFacade } from '../../../api/facades/suppliers-api.facade';
import { SuppliersDto } from '../../../api/generated';
import { SuppliersResourceService } from './suppliers-resource.service';

const ITEM: SuppliersDto = { supplierId: 1, companyName: 'Exotic Liquids' };

describe('SuppliersResourceService', () => {
  let service: SuppliersResourceService;
  let facade: Pick<SuppliersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: SuppliersApiFacade, useValue: facade }],
    });
    service = TestBed.inject(SuppliersResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every supplier with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one supplier into the item result', () => {
      service.getById('1');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().itemResult).toEqual(ITEM);
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed supplier', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Suppliers payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed supplier', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the supplier and records success', () => {
      service.deleteById('1');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().mutationResult).toEqual({ success: true });
    });
  });
});
