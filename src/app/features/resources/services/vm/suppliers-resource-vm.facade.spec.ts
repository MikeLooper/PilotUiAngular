import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SuppliersApiFacade } from '../../../../api/facades/suppliers-api.facade';
import { SuppliersDto } from '../../../../api/generated';
import { SuppliersResourceVmFacade } from './suppliers-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const SUPPLIER: SuppliersDto = {
  supplierId: 1,
  companyName: 'Exotic Liquids',
  contactName: 'Charlotte Cooper',
  contactTitle: 'Purchasing Manager',
  address: '49 Gilbert St.',
  city: 'London',
  region: null,
  country: 'UK',
  phone: '(171) 555-2222',
};
const MAX_LENGTHS = { companyName: 40, contactName: 30, city: 15, country: 15 };

describe('SuppliersResourceVmFacade', () => {
  let facade: SuppliersResourceVmFacade;
  let api: Pick<SuppliersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([SUPPLIER])),
      getById: vi.fn(() => of(SUPPLIER)),
      add: vi.fn(() => of({ id: 30 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: SuppliersApiFacade, useValue: api }],
    });
    facade = TestBed.inject(SuppliersResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the suppliers resource', () => {
      expect(facade.key).toBe('suppliers');
    });
  });

  describe('metadata', () => {
    it('describes the suppliers page', () => {
      const { heading, primaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Suppliers API',
        primaryIdLabel: 'Supplier ID',
        defaultPrimaryId: '1',
      });
    });
  });

  describe('pageDefaults', () => {
    it('starts with ten suppliers per page filtered by "exotic"', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '1',
        initialSearchTerm: 'exotic',
        pageSize: 10,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the suppliers with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each supplier to a record titled by company with contact details', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        {
          primaryId: '1',
          title: 'Exotic Liquids',
          subtitle: 'Charlotte Cooper • London • UK',
          raw: SUPPLIER,
        },
      ]);
    });

    it('uses fallback text when the company and details are blank', () => {
      vi.mocked(api.getAll).mockReturnValue(of([{ supplierId: 7, companyName: '' }]));

      facade.reload();

      expect(facade.vm().items[0]).toMatchObject({ title: 'Supplier #7', subtitle: 'No details' });
    });
  });

  describe('fetchById', () => {
    it('requests the supplier by numeric id', () => {
      facade.fetchById('2');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(2);
    });
  });

  describe('createSample', () => {
    it('adds a sample supplier without a server-generated id', () => {
      facade.createSample();

      const dto = vi.mocked(api.add).mock.lastCall?.[0];
      expect(dto).toMatchObject({ companyName: 'Sample Supplier', contactName: 'Sample Contact' });
      expect(dto).not.toHaveProperty('supplierId');
    });

    it('sends an add payload that satisfies the OpenAPI length limits', () => {
      facade.createSample();

      expectWithinMaxLengths(vi.mocked(api.add).mock.lastCall![0], MAX_LENGTHS);
    });
  });

  describe('updateSample', () => {
    it('updates the supplier with the given id', () => {
      facade.updateSample('2');

      expect(vi.mocked(api.update).mock.lastCall?.[0]).toMatchObject({
        supplierId: 2,
        companyName: 'Updated Supplier',
      });
    });

    it('updates the default supplier when no id is given', () => {
      facade.updateSample();

      expect(vi.mocked(api.update).mock.lastCall?.[0]).toMatchObject({ supplierId: 1 });
    });

    it('sends an update payload that satisfies the OpenAPI length limits', () => {
      facade.updateSample('2');

      expectWithinMaxLengths(vi.mocked(api.update).mock.lastCall![0], MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the supplier by numeric id', () => {
      facade.deleteById('30');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(30);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the supplier profile and address sections', () => {
      const sections = facade.mapSelectedItemSections(SUPPLIER);

      expect(sections).toEqual([
        {
          title: 'Supplier profile',
          kind: 'fields',
          fields: [
            { label: 'Supplier ID', value: '1' },
            { label: 'Company', value: 'Exotic Liquids' },
            { label: 'Contact', value: 'Charlotte Cooper' },
            { label: 'Title', value: 'Purchasing Manager' },
          ],
        },
        {
          title: 'Address and phone',
          kind: 'fields',
          fields: [
            { label: 'Address', value: '49 Gilbert St.' },
            { label: 'City', value: 'London' },
            { label: 'Region', value: '-' },
            { label: 'Country', value: 'UK' },
            { label: 'Phone', value: '(171) 555-2222' },
          ],
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the supplier mutation status', () => {
      const sections = facade.mapMutationResultSections({ id: 30 });

      expect(sections[0]).toEqual({
        title: 'Supplier status',
        kind: 'fields',
        fields: [
          { label: 'Action', value: 'Create' },
          { label: 'Status', value: 'Success' },
          { label: 'Supplier ID', value: '30' },
        ],
      });
    });
  });
});
