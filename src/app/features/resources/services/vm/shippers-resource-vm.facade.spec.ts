import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ShippersApiFacade } from '../../../../api/facades/shippers-api.facade';
import { ShippersDto } from '../../../../api/generated';
import { ShippersResourceVmFacade } from './shippers-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const SHIPPER: ShippersDto = { shipperId: 1, companyName: 'Speedy Express', phone: '555-3333' };
const MAX_LENGTHS = { companyName: 40, phone: 24 };

describe('ShippersResourceVmFacade', () => {
  let facade: ShippersResourceVmFacade;
  let api: Pick<ShippersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([SHIPPER])),
      getById: vi.fn(() => of(SHIPPER)),
      add: vi.fn(() => of({ id: 4 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ShippersApiFacade, useValue: api }],
    });
    facade = TestBed.inject(ShippersResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the shippers resource', () => {
      expect(facade.key).toBe('shippers');
    });
  });

  describe('metadata', () => {
    it('describes the shippers page', () => {
      const { heading, primaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Shippers API',
        primaryIdLabel: 'Shipper ID',
        defaultPrimaryId: '1',
      });
    });
  });

  describe('pageDefaults', () => {
    it('loads eight shippers per page', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '1',
        pageSize: 8,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the shippers with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each shipper to a record titled by company with its phone number', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        { primaryId: '1', title: 'Speedy Express', subtitle: '555-3333', raw: SHIPPER },
      ]);
    });

    it('uses fallback text when the company and phone are blank', () => {
      vi.mocked(api.getAll).mockReturnValue(of([{ shipperId: 6, companyName: '', phone: ' ' }]));

      facade.reload();

      expect(facade.vm().items[0]).toMatchObject({ title: 'Shipper #6', subtitle: 'No phone' });
    });
  });

  describe('fetchById', () => {
    it('requests the shipper by numeric id', () => {
      facade.fetchById('2');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(2);
    });
  });

  describe('createSamplePayload', () => {
    it('builds a sample shipper without a server-generated id', () => {
      const dto = facade.createSamplePayload();

      expect(dto).toEqual({ companyName: 'Sample Shipper', phone: '555-0110' });
      expect(dto).not.toHaveProperty('shipperId');
    });

    it('builds an add payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.createSamplePayload();

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('updateSamplePayload', () => {
    it('targets the shipper with the given id', () => {
      const payload = facade.updateSamplePayload('2');

      expect(payload).toEqual({
        shipperId: 2,
        companyName: 'Updated Shipper',
        phone: '555-0111',
      });
    });

    it('targets the default shipper when no id is given', () => {
      const payload = facade.updateSamplePayload();

      expect(payload).toMatchObject({ shipperId: 1 });
    });

    it('builds an update payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.updateSamplePayload('2');

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the shipper by numeric id', () => {
      facade.deleteById('4');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(4);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the shipper profile', () => {
      const sections = facade.mapSelectedItemSections(SHIPPER);

      expect(sections).toEqual([
        {
          title: 'Shipper profile',
          kind: 'fields',
          fields: [
            { label: 'Shipper ID', value: '1' },
            { label: 'Company', value: 'Speedy Express' },
            { label: 'Phone', value: '555-3333' },
          ],
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the shipper mutation status', () => {
      const sections = facade.mapMutationResultSections({ id: 4 });

      expect(sections[0]).toEqual({
        title: 'Shipper status',
        kind: 'fields',
        fields: [
          { label: 'Action', value: 'Create' },
          { label: 'Status', value: 'Success' },
          { label: 'Shipper ID', value: '4' },
        ],
      });
    });
  });
});
