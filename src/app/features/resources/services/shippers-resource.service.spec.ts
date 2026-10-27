import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ShippersApiFacade } from '../../../api/facades/shippers-api.facade';
import { ShippersDto } from '../../../api/generated';
import { ShippersResourceService } from './shippers-resource.service';

const ITEM: ShippersDto = { shipperId: 1, companyName: 'Speedy Express' };

describe('ShippersResourceService', () => {
  let service: ShippersResourceService;
  let facade: Pick<ShippersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ShippersApiFacade, useValue: facade }],
    });
    service = TestBed.inject(ShippersResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every shipper with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one shipper into the item result', () => {
      service.getById('1');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().itemResult).toEqual(ITEM);
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed shipper', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Shippers payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed shipper', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the shipper and records success', () => {
      service.deleteById('1');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().mutationResult).toEqual({ success: true });
    });
  });
});
