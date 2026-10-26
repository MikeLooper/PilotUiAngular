import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrderDetailsApiFacade } from '../../../../api/facades/order-details-api.facade';
import { OrderDetailsDto } from '../../../../api/generated';
import { OrderDetailsResourceVmFacade } from './order-details-resource-vm.facade';

const ORDER_DETAIL: OrderDetailsDto = {
  orderId: 10248,
  productId: 11,
  unitPrice: 14,
  quantity: 12,
  discount: 0,
};

describe('OrderDetailsResourceVmFacade', () => {
  let facade: OrderDetailsResourceVmFacade;
  let api: Pick<OrderDetailsApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  /** OpenAPI ranges for order detail numbers: quantity >= 1 and 0 <= discount <= 1. */
  function expectWithinOpenApiRanges(dto: OrderDetailsDto): void {
    expect(Number(dto.quantity)).toBeGreaterThanOrEqual(1);
    expect(Number(dto.discount)).toBeGreaterThanOrEqual(0);
    expect(Number(dto.discount)).toBeLessThanOrEqual(1);
  }

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([ORDER_DETAIL])),
      getById: vi.fn(() => of(ORDER_DETAIL)),
      add: vi.fn(() => of({ orderId: 10248, productId: 1 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: OrderDetailsApiFacade, useValue: api }],
    });
    facade = TestBed.inject(OrderDetailsResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the order details resource', () => {
      expect(facade.key).toBe('order-details');
    });
  });

  describe('metadata', () => {
    it('describes the order details page with a composite id', () => {
      const { heading, primaryIdLabel, secondaryIdLabel, defaultPrimaryId, defaultSecondaryId } =
        facade;

      expect({
        heading,
        primaryIdLabel,
        secondaryIdLabel,
        defaultPrimaryId,
        defaultSecondaryId,
      }).toEqual({
        heading: 'Order Details API',
        primaryIdLabel: 'Product ID',
        secondaryIdLabel: 'Order ID',
        defaultPrimaryId: '1',
        defaultSecondaryId: '10248',
      });
    });
  });

  describe('pageDefaults', () => {
    it('loads twelve order details per page with both default ids', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '1',
        initialSecondaryId: '10248',
        pageSize: 12,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the order details with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each order detail to a record keyed by product and order', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        {
          primaryId: '11',
          secondaryId: '10248',
          title: 'Order 10248 • Product 11',
          subtitle: 'Qty 12 • Unit 14 • Discount 0',
          raw: ORDER_DETAIL,
        },
      ]);
    });
  });

  describe('fetchById', () => {
    it('requests the order detail by product and order id', () => {
      facade.fetchById('11', '10249');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(11, 10249);
    });

    it('falls back to the default ids when they are empty', () => {
      facade.fetchById('', '');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(1, 10248);
    });
  });

  describe('createSamplePayload', () => {
    it('builds the sample order detail', () => {
      const payload = facade.createSamplePayload() as OrderDetailsDto;

      expect(payload).toEqual({
        productId: 1,
        orderId: 10248,
        unitPrice: 18,
        quantity: 10,
        discount: 0,
      });
    });

    it('keeps quantity and discount within the OpenAPI ranges in the add payload', () => {
      const payload = facade.createSamplePayload() as OrderDetailsDto;

      expectWithinOpenApiRanges(payload);
    });
  });

  describe('updateSamplePayload', () => {
    it('targets the order detail with the given ids', () => {
      const payload = facade.updateSamplePayload('11', '10249') as OrderDetailsDto;

      expect(payload).toEqual({
        productId: 11,
        orderId: 10249,
        unitPrice: 18,
        quantity: 12,
        discount: 0.1,
      });
    });

    it('targets the default order detail when no ids are given', () => {
      const payload = facade.updateSamplePayload();

      expect(payload).toMatchObject({
        productId: 1,
        orderId: 10248,
      });
    });

    it('keeps quantity and discount within the OpenAPI ranges in the update payload', () => {
      const payload = facade.updateSamplePayload('11', '10249') as OrderDetailsDto;

      expectWithinOpenApiRanges(payload);
    });
  });

  describe('deleteById', () => {
    it('deletes the order detail by product and order id', () => {
      facade.deleteById('11', '10249');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(11, 10249);
    });

    it('falls back to the default order id when it is missing', () => {
      facade.deleteById('11');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(11, 10248);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the line item metrics as a table', () => {
      const sections = facade.mapSelectedItemSections(ORDER_DETAIL);

      expect(sections).toEqual([
        {
          title: 'Line item metrics',
          kind: 'table',
          table: {
            columns: ['Order ID', 'Product ID', 'Unit price', 'Quantity', 'Discount'],
            rows: [['10248', '11', '14', '12', '0']],
          },
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the order detail status with the composite key format', () => {
      const sections = facade.mapMutationResultSections({ id: 'line-1' });

      expect(sections).toEqual([
        {
          title: 'Order detail status',
          kind: 'fields',
          fields: [
            { label: 'Action', value: 'Create' },
            { label: 'Status', value: 'Success' },
            { label: 'Line ID', value: 'line-1' },
            { label: 'Composite key format', value: 'Product ID + Order ID' },
          ],
        },
      ]);
    });
  });
});
