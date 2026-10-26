import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CategoriesApiFacade } from '../../../../api/facades/categories-api.facade';
import { CategoriesDto } from '../../../../api/generated';
import { CategoriesResourceVmFacade } from './categories-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const CATEGORY: CategoriesDto = {
  categoryId: 1,
  categoryName: 'Beverages',
  description: 'Soft drinks',
};
const MAX_LENGTHS = { categoryName: 15 };

describe('CategoriesResourceVmFacade', () => {
  let facade: CategoriesResourceVmFacade;
  let api: Pick<CategoriesApiFacade, 'getAllDtos' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAllDtos: vi.fn(() => of([CATEGORY])),
      getById: vi.fn(() => of(CATEGORY)),
      add: vi.fn(() => of({ id: 9 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CategoriesApiFacade, useValue: api }],
    });
    facade = TestBed.inject(CategoriesResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the categories resource', () => {
      expect(facade.key).toBe('categories');
    });
  });

  describe('metadata', () => {
    it('describes the categories page', () => {
      const { heading, primaryIdLabel, secondaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, secondaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Categories API',
        primaryIdLabel: 'Category ID',
        secondaryIdLabel: undefined,
        defaultPrimaryId: '1',
      });
    });
  });

  describe('pageDefaults', () => {
    it('loads eight categories per page without forcing a refresh on entry', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '1',
        pageSize: 8,
        autoLoadOnEnter: true,
        forceRefreshOnEnter: false,
      });
    });
  });

  describe('reload', () => {
    it('loads the category DTOs with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAllDtos).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each category to a record titled by its name', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        { primaryId: '1', title: 'Beverages', subtitle: 'Soft drinks', raw: CATEGORY },
      ]);
    });

    it('uses fallback text for a blank name and missing description', () => {
      vi.mocked(api.getAllDtos).mockReturnValue(of([{ categoryId: 2, categoryName: '  ' }]));

      facade.reload();

      expect(facade.vm().items[0]).toMatchObject({
        title: 'Untitled category',
        subtitle: 'No description',
      });
    });
  });

  describe('fetchById', () => {
    it('requests the category by numeric id', () => {
      facade.fetchById('7');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(7);
    });

    it('falls back to category 1 for an empty id', () => {
      facade.fetchById('');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(1);
    });
  });

  describe('createSamplePayload', () => {
    it('builds a sample category without a server-generated id', () => {
      const dto = facade.createSamplePayload();

      expect(dto).toEqual({
        categoryName: 'Sample category',
        description: 'Created from Categories resource page',
        picture: null,
      });
      expect(dto).not.toHaveProperty('categoryId');
    });

    it('builds an add payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.createSamplePayload();

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('updateSamplePayload', () => {
    it('targets the category with the given id', () => {
      const payload = facade.updateSamplePayload('4');

      expect(payload).toMatchObject({
        categoryId: 4,
        categoryName: 'Updated name',
      });
    });

    it('targets the default category when no id is given', () => {
      const payload = facade.updateSamplePayload();

      expect(payload).toMatchObject({ categoryId: 1 });
    });

    it('builds an update payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.updateSamplePayload('4');

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the category by numeric id', () => {
      facade.deleteById('4');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(4);
    });

    it('falls back to category 1 for an empty id', () => {
      facade.deleteById('');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(1);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the category profile', () => {
      const sections = facade.mapSelectedItemSections(CATEGORY);

      expect(sections).toEqual([
        {
          title: 'Category profile',
          kind: 'fields',
          fields: [
            { label: 'Category ID', value: '1' },
            { label: 'Name', value: 'Beverages' },
            { label: 'Description', value: 'Soft drinks' },
          ],
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the category mutation status', () => {
      const sections = facade.mapMutationResultSections({ id: 9 });

      expect(sections).toEqual([
        {
          title: 'Category status',
          kind: 'fields',
          fields: [
            { label: 'Action', value: 'Create' },
            { label: 'Status', value: 'Success' },
            { label: 'Category ID', value: '9' },
          ],
        },
      ]);
    });
  });
});
