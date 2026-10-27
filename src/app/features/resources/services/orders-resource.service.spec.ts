import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrdersApiFacade } from '../../../api/facades/orders-api.facade';
import { OrdersDto } from '../../../api/generated';
import { OrdersResourceService } from './orders-resource.service';

const ITEM: OrdersDto = { orderId: 10248, customerId: 'VINET' };

describe('OrdersResourceService', () => {
  let service: OrdersResourceService;
  let facade: Pick<OrdersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: OrdersApiFacade, useValue: facade }],
    });
    service = TestBed.inject(OrdersResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every order with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one order into the item result', () => {
      service.getById('10248');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(10248);
      expect(service.state().itemResult).toEqual(ITEM);
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed order', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Orders payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed order', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the order and records success', () => {
      service.deleteById('11077');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(11077);
      expect(service.state().mutationResult).toEqual({ success: true });
    });
  });
});
