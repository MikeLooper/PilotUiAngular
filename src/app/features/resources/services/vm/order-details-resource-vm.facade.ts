import { Injectable } from '@angular/core';
import { OrderDetailsApiFacade } from '../../../../api/facades/order-details-api.facade';
import { OrderDetailsDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class OrderDetailsResourceVmFacade extends BaseResourceCrudVmFacade<OrderDetailsDto> {
  public readonly key = 'order-details' as const;

  public constructor(private readonly orderDetailsApiFacade: OrderDetailsApiFacade) {
    super({
      heading: 'Order Details API',
      description: 'Manage order detail rows with composite identifiers.',
      primaryIdLabel: 'Product ID',
      secondaryIdLabel: 'Order ID',
      defaultPrimaryId: '1',
      defaultSecondaryId: '10248',
      pageDefaults: {
        initialPrimaryId: '1',
        initialSecondaryId: '10248',
        pageSize: 12,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.orderDetailsApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string, secondaryId?: string) {
    return this.orderDetailsApiFacade.getById(
      this.asNumberishId(primaryId, this.defaultPrimaryId),
      this.asNumberishId(secondaryId, this.defaultSecondaryId || '10248')
    );
  }

  protected createSampleDto(): OrderDetailsDto {
    return {
      productID: 1,
      orderID: 10248,
      unitPrice: 18,
      quantity: 10,
      discount: 0,
    };
  }

  protected updateSampleDto(primaryId?: string, secondaryId?: string): OrderDetailsDto {
    return {
      productID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      orderID: this.asNumberishId(secondaryId, this.defaultSecondaryId || '10248'),
      unitPrice: 18,
      quantity: 12,
      discount: 0.1,
    };
  }

  protected addDto(dto: OrderDetailsDto) {
    return this.orderDetailsApiFacade.add(dto);
  }

  protected updateDto(dto: OrderDetailsDto) {
    return this.orderDetailsApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string, secondaryId?: string) {
    return this.orderDetailsApiFacade.delete(
      this.asNumberishId(primaryId, this.defaultPrimaryId),
      this.asNumberishId(secondaryId, this.defaultSecondaryId || '10248')
    );
  }

  protected mapDtoToRecord(dto: OrderDetailsDto): ResourceRecord {
    return {
      primaryId: String(dto.productID),
      secondaryId: String(dto.orderID),
      title: `Order ${dto.orderID} • Product ${dto.productID}`,
      subtitle: `Qty ${dto.quantity} • Unit ${dto.unitPrice} • Discount ${dto.discount}`,
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const detail = value as OrderDetailsDto;

    return [
      this.createTableSection(
        'Line item metrics',
        ['Order ID', 'Product ID', 'Unit price', 'Quantity', 'Discount'],
        [[detail.orderID, detail.productID, detail.unitPrice, detail.quantity, detail.discount]]
      ),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    const sections = this.mapMutationResultForResource('Order detail', 'Line ID', value);
    const defaultSection = sections[0];

    if (!defaultSection || defaultSection.kind !== 'fields' || !defaultSection.fields) {
      return sections;
    }

    return [
      this.createFieldsSection('Order detail status', [
        ...defaultSection.fields,
        { label: 'Composite key format', value: 'Product ID + Order ID' },
      ]),
    ];
  }
}
