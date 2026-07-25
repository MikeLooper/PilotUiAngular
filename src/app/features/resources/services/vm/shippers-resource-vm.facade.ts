import { Injectable } from '@angular/core';
import { ShippersApiFacade } from '../../../../api/facades/shippers-api.facade';
import { ShippersDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class ShippersResourceVmFacade extends BaseResourceCrudVmFacade<ShippersDto> {
  public readonly key = 'shippers' as const;

  public constructor(private readonly shippersApiFacade: ShippersApiFacade) {
    super({
      heading: 'Shippers API',
      description: 'Inspect and update shipper records.',
      primaryIdLabel: 'Shipper ID',
      defaultPrimaryId: '1',
      pageDefaults: {
        initialPrimaryId: '1',
        pageSize: 8,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.shippersApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.shippersApiFacade.getById(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected createSampleDto(): ShippersDto {
    return {
      shipperID: 0,
      companyName: 'Sample Shipper',
      phone: '555-0110',
    };
  }

  protected updateSampleDto(primaryId?: string): ShippersDto {
    return {
      shipperID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      companyName: 'Updated Shipper',
      phone: '555-0111',
    };
  }

  protected addDto(dto: ShippersDto) {
    return this.shippersApiFacade.add(dto);
  }

  protected updateDto(dto: ShippersDto) {
    return this.shippersApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.shippersApiFacade.delete(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected mapDtoToRecord(dto: ShippersDto): ResourceRecord {
    return {
      primaryId: String(dto.shipperID),
      title: dto.companyName?.trim() || `Shipper #${dto.shipperID}`,
      subtitle: dto.phone?.trim() || 'No phone',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const shipper = value as ShippersDto;

    return [
      this.createFieldsSection('Shipper profile', [
        { label: 'Shipper ID', value: shipper.shipperID },
        { label: 'Company', value: shipper.companyName },
        { label: 'Phone', value: shipper.phone },
      ]),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Shipper', 'Shipper ID', value);
  }
}
