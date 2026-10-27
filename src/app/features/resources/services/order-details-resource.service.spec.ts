import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrderDetailsApiFacade } from '../../../api/facades/order-details-api.facade';
import { OrderDetailsDto } from '../../../api/generated';
import { OrderDetailsResourceService } from './order-details-resource.service';

const ITEM: OrderDetailsDto = {
  orderId: 10248,
  productId: 1,
  unitPrice: 18,
  quantity: 10,
  discount: 0,
};

describe('OrderDetailsResourceService', () => {
  let service: OrderDetailsResourceService;
  let facade: Pick<OrderDetailsApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ orderId: 10248, productId: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: OrderDetailsApiFacade, useValue: facade }],
    });
    service = TestBed.inject(OrderDetailsResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every order detail with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one order detail into the item result', () => {
      service.getById('1', '10248');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1, 10248);
      expect(service.state().itemResult).toEqual(ITEM);
    });

    it('passes an empty order id when the second id is missing', () => {
      service.getById('1');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1, '');
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed order detail', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid OrderDetails payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed order detail', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the order detail and records success', () => {
      service.deleteById('1', '10248');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1, 10248);
      expect(service.state().mutationResult).toEqual({ success: true });
    });

    it('passes an empty order id when the second id is missing', () => {
      service.deleteById('1');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1, '');
    });
  });
});
