import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductsApiFacade } from '../../../../api/facades/products-api.facade';
import { ProductsDto } from '../../../../api/generated';
import { ProductsResourceVmFacade } from './products-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const PRODUCT: ProductsDto = {
  productId: 1,
  productName: 'Chai',
  supplierId: 1,
  categoryId: 1,
  quantityPerUnit: '10 boxes x 20 bags',
  unitPrice: 18,
  unitsInStock: 39,
  unitsOnOrder: 0,
  reorderLevel: 10,
  discontinued: false,
};
const MAX_LENGTHS = { productName: 40 };

describe('ProductsResourceVmFacade', () => {
  let facade: ProductsResourceVmFacade;
  let api: Pick<ProductsApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([PRODUCT])),
      getById: vi.fn(() => of(PRODUCT)),
      add: vi.fn(() => of({ id: 78 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ProductsApiFacade, useValue: api }],
    });
    facade = TestBed.inject(ProductsResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the products resource', () => {
      expect(facade.key).toBe('products');
    });
  });

  describe('metadata', () => {
    it('describes the products page', () => {
      const { heading, primaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Products API',
        primaryIdLabel: 'Product ID',
        defaultPrimaryId: '1',
      });
    });
  });

  describe('pageDefaults', () => {
    it('starts with ten products per page filtered by "chai"', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '1',
        initialSearchTerm: 'chai',
        pageSize: 10,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the products with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each product to a record titled by name with packaging and price', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        { primaryId: '1', title: 'Chai', subtitle: '10 boxes x 20 bags • $18', raw: PRODUCT },
      ]);
    });

    it('uses fallback text when the name, packaging, and price are missing', () => {
      vi.mocked(api.getAll).mockReturnValue(of([{ productId: 5, productName: ' ', unitPrice: 0 }]));

      facade.reload();

      expect(facade.vm().items[0]).toMatchObject({ title: 'Product #5', subtitle: 'No details' });
    });
  });

  describe('fetchById', () => {
    it('requests the product by numeric id', () => {
      facade.fetchById('3');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(3);
    });
  });

  describe('createSample', () => {
    it('adds a sample product without a server-generated id', () => {
      facade.createSample();

      const dto = vi.mocked(api.add).mock.lastCall?.[0];
      expect(dto).toMatchObject({ productName: 'Sample Product', discontinued: false });
      expect(dto).not.toHaveProperty('productId');
    });

    it('sends an add payload that satisfies the OpenAPI length limits', () => {
      facade.createSample();

      expectWithinMaxLengths(vi.mocked(api.add).mock.lastCall![0], MAX_LENGTHS);
    });
  });

  describe('updateSample', () => {
    it('updates the product with the given id', () => {
      facade.updateSample('3');

      expect(vi.mocked(api.update).mock.lastCall?.[0]).toMatchObject({
        productId: 3,
        productName: 'Updated Product',
      });
    });

    it('updates the default product when no id is given', () => {
      facade.updateSample();

      expect(vi.mocked(api.update).mock.lastCall?.[0]).toMatchObject({ productId: 1 });
    });

    it('sends an update payload that satisfies the OpenAPI length limits', () => {
      facade.updateSample('3');

      expectWithinMaxLengths(vi.mocked(api.update).mock.lastCall![0], MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the product by numeric id', () => {
      facade.deleteById('78');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(78);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the product snapshot and an inventory metrics table', () => {
      const sections = facade.mapSelectedItemSections(PRODUCT);

      expect(sections).toEqual([
        {
          title: 'Product snapshot',
          kind: 'fields',
          fields: [
            { label: 'Product ID', value: '1' },
            { label: 'Name', value: 'Chai' },
            { label: 'Supplier ID', value: '1' },
            { label: 'Category ID', value: '1' },
            { label: 'Quantity per unit', value: '10 boxes x 20 bags' },
          ],
        },
        {
          title: 'Inventory metrics',
          kind: 'table',
          table: {
            columns: ['Unit price', 'In stock', 'On order', 'Reorder level', 'Discontinued'],
            rows: [['18', '39', '0', '10', 'false']],
          },
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the product mutation status', () => {
      const sections = facade.mapMutationResultSections({ id: 78 });

      expect(sections[0]).toEqual({
        title: 'Product status',
        kind: 'fields',
        fields: [
          { label: 'Action', value: 'Create' },
          { label: 'Status', value: 'Success' },
          { label: 'Product ID', value: '78' },
        ],
      });
    });
  });
});
