import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductsApiFacade } from '../../../api/facades/products-api.facade';
import { ProductsDto } from '../../../api/generated';
import { ProductsResourceService } from './products-resource.service';

const ITEM: ProductsDto = { productId: 1, productName: 'Chai' };

describe('ProductsResourceService', () => {
  let service: ProductsResourceService;
  let facade: Pick<ProductsApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAll: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ProductsApiFacade, useValue: facade }],
    });
    service = TestBed.inject(ProductsResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every product with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAll).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one product into the item result', () => {
      service.getById('1');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().itemResult).toEqual(ITEM);
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed product', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Products payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed product', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the product and records success', () => {
      service.deleteById('1');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().mutationResult).toEqual({ success: true });
    });
  });
});
