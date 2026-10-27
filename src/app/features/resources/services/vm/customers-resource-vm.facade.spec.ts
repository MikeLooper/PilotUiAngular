import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CustomersApiFacade } from '../../../../api/facades/customers-api.facade';
import { CustomersDto } from '../../../../api/generated';
import { CustomersResourceVmFacade } from './customers-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const CUSTOMER: CustomersDto = {
  customerId: 'ALFKI',
  companyName: 'Alfreds Futterkiste',
  contactName: 'Maria Anders',
  contactTitle: 'Sales Representative',
  city: 'Berlin',
  region: null,
  country: 'Germany',
  phone: '030-0074321',
};
const MAX_LENGTHS = { customerId: 5, companyName: 40, contactName: 30, city: 15, country: 15 };

describe('CustomersResourceVmFacade', () => {
  let facade: CustomersResourceVmFacade;
  let api: Pick<CustomersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([CUSTOMER])),
      getById: vi.fn(() => of(CUSTOMER)),
      add: vi.fn(() => of({ id: 'NEW01' })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CustomersApiFacade, useValue: api }],
    });
    facade = TestBed.inject(CustomersResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the customers resource', () => {
      expect(facade.key).toBe('customers');
    });
  });

  describe('metadata', () => {
    it('describes the customers page', () => {
      const { heading, primaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Customers API',
        primaryIdLabel: 'Customer ID',
        defaultPrimaryId: 'ALFKI',
      });
    });
  });

  describe('pageDefaults', () => {
    it('starts with ten customers per page filtered by "alf"', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: 'ALFKI',
        initialSearchTerm: 'alf',
        pageSize: 10,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the customers with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each customer to a record titled by company with contact details', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        {
          primaryId: 'ALFKI',
          title: 'Alfreds Futterkiste',
          subtitle: 'Maria Anders • Berlin • Germany',
          raw: CUSTOMER,
        },
      ]);
    });

    it('uses fallback text when the company and details are blank', () => {
      vi.mocked(api.getAll).mockReturnValue(of([{ customerId: 'BLANK', companyName: ' ' }]));

      facade.reload();

      expect(facade.vm().items[0]).toMatchObject({
        primaryId: 'BLANK',
        title: 'Unnamed customer',
        subtitle: 'No details',
      });
    });
  });

  describe('fetchById', () => {
    it('requests the customer by its string id', () => {
      facade.fetchById('BONAP');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith('BONAP');
    });
  });

  describe('createSamplePayload', () => {
    it('builds the sample customer', () => {
      const payload = facade.createSamplePayload();

      expect(payload).toEqual({
        customerId: 'NEW01',
        companyName: 'Sample Customer Co',
        contactName: 'Sample Contact',
        city: 'Seattle',
        country: 'USA',
      });
    });

    it('builds an add payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.createSamplePayload();

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('updateSamplePayload', () => {
    it('targets the customer with the given id', () => {
      const payload = facade.updateSamplePayload('BONAP');

      expect(payload).toMatchObject({
        customerId: 'BONAP',
        companyName: 'Updated Customer Co',
      });
    });

    it('targets the default customer when no id is given', () => {
      const payload = facade.updateSamplePayload('');

      expect(payload).toMatchObject({ customerId: 'ALFKI' });
    });

    it('builds an update payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.updateSamplePayload('BONAP');

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the customer with the given id', () => {
      facade.deleteById('BONAP');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith('BONAP');
    });

    it('deletes the default customer for an empty id', () => {
      facade.deleteById('');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith('ALFKI');
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the customer profile and location sections', () => {
      const sections = facade.mapSelectedItemSections(CUSTOMER);

      expect(sections).toEqual([
        {
          title: 'Customer profile',
          kind: 'fields',
          fields: [
            { label: 'Customer ID', value: 'ALFKI' },
            { label: 'Company', value: 'Alfreds Futterkiste' },
            { label: 'Contact', value: 'Maria Anders' },
            { label: 'Title', value: 'Sales Representative' },
          ],
        },
        {
          title: 'Location and phone',
          kind: 'fields',
          fields: [
            { label: 'City', value: 'Berlin' },
            { label: 'Region', value: '-' },
            { label: 'Country', value: 'Germany' },
            { label: 'Phone', value: '030-0074321' },
          ],
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the customer mutation status', () => {
      const sections = facade.mapMutationResultSections({ id: 'NEW01' });

      expect(sections[0]).toEqual({
        title: 'Customer status',
        kind: 'fields',
        fields: [
          { label: 'Action', value: 'Create' },
          { label: 'Status', value: 'Success' },
          { label: 'Customer ID', value: 'NEW01' },
        ],
      });
    });
  });
});
