import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrdersApiFacade } from '../../../../api/facades/orders-api.facade';
import { OrdersDto } from '../../../../api/generated';
import { OrdersResourceVmFacade } from './orders-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const ORDER: OrdersDto = {
  orderId: 10248,
  customerId: 'VINET',
  employeeId: 5,
  freight: 32.38,
  shipName: 'Vins et alcools Chevalier',
  shipCity: 'Reims',
  shipRegion: null,
  shipCountry: 'France',
};
const MAX_LENGTHS = { customerId: 5, shipCity: 15, shipCountry: 15 };

describe('OrdersResourceVmFacade', () => {
  let facade: OrdersResourceVmFacade;
  let api: Pick<OrdersApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([ORDER])),
      getById: vi.fn(() => of(ORDER)),
      add: vi.fn(() => of({ id: 11078 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: OrdersApiFacade, useValue: api }],
    });
    facade = TestBed.inject(OrdersResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the orders resource', () => {
      expect(facade.key).toBe('orders');
    });
  });

  describe('metadata', () => {
    it('describes the orders page', () => {
      const { heading, primaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Orders API',
        primaryIdLabel: 'Order ID',
        defaultPrimaryId: '10248',
      });
    });
  });

  describe('pageDefaults', () => {
    it('loads twelve orders per page', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '10248',
        pageSize: 12,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the orders with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each order to a record titled by order number with shipping details', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        {
          primaryId: '10248',
          title: 'Order #10248',
          subtitle: 'VINET • Reims • France',
          raw: ORDER,
        },
      ]);
    });

    it('uses fallback subtitle text when there are no details', () => {
      vi.mocked(api.getAll).mockReturnValue(of([{ orderId: 1 }]));

      facade.reload();

      expect(facade.vm().items[0]?.subtitle).toBe('No details');
    });
  });

  describe('fetchById', () => {
    it('requests the order by numeric id', () => {
      facade.fetchById('10250');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(10250);
    });

    it('falls back to order 10248 for an empty id', () => {
      facade.fetchById('');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(10248);
    });
  });

  describe('createSamplePayload', () => {
    it('builds a sample order without a server-generated id', () => {
      const dto = facade.createSamplePayload();

      expect(dto).toEqual({
        customerId: 'ALFKI',
        employeeId: 1,
        shipCity: 'Seattle',
        shipCountry: 'USA',
      });
      expect(dto).not.toHaveProperty('orderId');
    });

    it('builds an add payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.createSamplePayload();

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('updateSamplePayload', () => {
    it('targets the order with the given id', () => {
      const payload = facade.updateSamplePayload('10250');

      expect(payload).toMatchObject({
        orderId: 10250,
        shipCity: 'Portland',
      });
    });

    it('targets the default order when no id is given', () => {
      const payload = facade.updateSamplePayload();

      expect(payload).toMatchObject({ orderId: 10248 });
    });

    it('builds an update payload that satisfies the OpenAPI length limits', () => {
      const payload = facade.updateSamplePayload('10250');

      expectWithinMaxLengths(payload, MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the order by numeric id', () => {
      facade.deleteById('11077');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(11077);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the order summary and shipping details', () => {
      const sections = facade.mapSelectedItemSections(ORDER);

      expect(sections).toEqual([
        {
          title: 'Order summary',
          kind: 'fields',
          fields: [
            { label: 'Order ID', value: '10248' },
            { label: 'Customer ID', value: 'VINET' },
            { label: 'Employee ID', value: '5' },
            { label: 'Freight', value: '32.38' },
          ],
        },
        {
          title: 'Shipping details',
          kind: 'fields',
          fields: [
            { label: 'Ship name', value: 'Vins et alcools Chevalier' },
            { label: 'Ship city', value: 'Reims' },
            { label: 'Ship region', value: '-' },
            { label: 'Ship country', value: 'France' },
          ],
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the order mutation status', () => {
      const sections = facade.mapMutationResultSections({ id: 11078 });

      expect(sections[0]).toEqual({
        title: 'Order status',
        kind: 'fields',
        fields: [
          { label: 'Action', value: 'Create' },
          { label: 'Status', value: 'Success' },
          { label: 'Order ID', value: '11078' },
        ],
      });
    });
  });
});
