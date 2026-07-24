import { Injectable } from '@angular/core';
import { OrdersApiFacade } from '../../../../api/facades/orders-api.facade';
import { OrdersDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class OrdersResourceVmFacade extends BaseResourceCrudVmFacade<OrdersDto> {
  public readonly key = 'orders' as const;

  public constructor(private readonly ordersApiFacade: OrdersApiFacade) {
    super({
      heading: 'Orders API',
      description: 'Track and manage order records with client-side list controls.',
      primaryIdLabel: 'Order ID',
      defaultPrimaryId: '10248',
      pageDefaults: {
        initialPrimaryId: '10248',
        pageSize: 12,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.ordersApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.ordersApiFacade.getById(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected createSampleDto(): OrdersDto {
    return {
      orderID: 0,
      customerID: 'ALFKI',
      employeeID: 1,
      shipCity: 'Seattle',
      shipCountry: 'USA',
    };
  }

  protected updateSampleDto(primaryId?: string): OrdersDto {
    return {
      orderID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      customerID: 'ALFKI',
      employeeID: 1,
      shipCity: 'Portland',
      shipCountry: 'USA',
    };
  }

  protected addDto(dto: OrdersDto) {
    return this.ordersApiFacade.add(dto);
  }

  protected updateDto(dto: OrdersDto) {
    return this.ordersApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.ordersApiFacade.delete(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected mapDtoToRecord(dto: OrdersDto): ResourceRecord {
    return {
      primaryId: String(dto.orderID),
      title: `Order #${dto.orderID}`,
      subtitle: [dto.customerID, dto.shipCity, dto.shipCountry].filter(Boolean).join(' • ') || 'No details',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const order = value as OrdersDto;

    return [
      this.createFieldsSection('Order summary', [
        { label: 'Order ID', value: order.orderID },
        { label: 'Customer ID', value: order.customerID },
        { label: 'Employee ID', value: order.employeeID },
        { label: 'Freight', value: order.freight },
      ]),
      this.createFieldsSection('Shipping details', [
        { label: 'Ship name', value: order.shipName },
        { label: 'Ship city', value: order.shipCity },
        { label: 'Ship region', value: order.shipRegion },
        { label: 'Ship country', value: order.shipCountry },
      ]),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Order', 'Order ID', value);
  }
}
