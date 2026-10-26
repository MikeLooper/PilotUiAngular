import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CategoriesApiFacade } from '../../../api/facades/categories-api.facade';
import { CategoriesDto } from '../../../api/generated';
import { CategoriesResourceService } from './categories-resource.service';

const ITEM: CategoriesDto = { categoryId: 1, categoryName: 'Beverages' };

describe('CategoriesResourceService', () => {
  let service: CategoriesResourceService;
  let facade: Pick<CategoriesApiFacade, 'getAllDtos' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    facade = {
      getAllDtos: vi.fn(() => of([ITEM])),
      getById: vi.fn(() => of(ITEM)),
      add: vi.fn(() => of({ id: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CategoriesApiFacade, useValue: facade }],
    });
    service = TestBed.inject(CategoriesResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('loads every category with a forced refresh into the list result', () => {
      service.loadAll();

      expect(facade.getAllDtos).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state().listResult).toEqual([ITEM]);
    });
  });

  describe('getById', () => {
    it('fetches one category into the item result', () => {
      service.getById('1');

      expect(facade.getById).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().itemResult).toEqual(ITEM);
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed category', () => {
      service.addFromJson(JSON.stringify(ITEM));

      expect(facade.add).toHaveBeenCalledExactlyOnceWith(ITEM);
    });

    it('names the resource in the invalid-payload error', () => {
      service.addFromJson('{ not json');

      expect(service.state().error).toBe('Invalid Categories payload JSON.');
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed category', () => {
      service.updateFromJson(JSON.stringify(ITEM));

      expect(facade.update).toHaveBeenCalledExactlyOnceWith(ITEM);
    });
  });

  describe('deleteById', () => {
    it('deletes the category and records success', () => {
      service.deleteById('1');

      expect(facade.delete).toHaveBeenCalledExactlyOnceWith(1);
      expect(service.state().mutationResult).toEqual({ success: true });
    });
  });
});
