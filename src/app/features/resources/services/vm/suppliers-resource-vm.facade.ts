import { Injectable } from '@angular/core';
import { SuppliersApiFacade } from '../../../../api/facades/suppliers-api.facade';
import { SuppliersDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class SuppliersResourceVmFacade extends BaseResourceCrudVmFacade<SuppliersDto> {
  public readonly key = 'suppliers' as const;

  public constructor(private readonly suppliersApiFacade: SuppliersApiFacade) {
    super({
      heading: 'Suppliers API',
      description: 'Manage suppliers with searchable and paged list behavior.',
      primaryIdLabel: 'Supplier ID',
      defaultPrimaryId: '1',
      pageDefaults: {
        initialPrimaryId: '1',
        initialSearchTerm: 'exotic',
        pageSize: 10,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.suppliersApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.suppliersApiFacade.getById(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected createSampleDto(): SuppliersDto {
    return {
      supplierID: 0,
      companyName: 'Sample Supplier',
      contactName: 'Sample Contact',
      city: 'Seattle',
      country: 'USA',
    };
  }

  protected updateSampleDto(primaryId?: string): SuppliersDto {
    return {
      supplierID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      companyName: 'Updated Supplier',
      contactName: 'Updated Contact',
      city: 'Portland',
      country: 'USA',
    };
  }

  protected addDto(dto: SuppliersDto) {
    return this.suppliersApiFacade.add(dto);
  }

  protected updateDto(dto: SuppliersDto) {
    return this.suppliersApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.suppliersApiFacade.delete(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected mapDtoToRecord(dto: SuppliersDto): ResourceRecord {
    return {
      primaryId: String(dto.supplierID),
      title: dto.companyName?.trim() || `Supplier #${dto.supplierID}`,
      subtitle: [dto.contactName, dto.city, dto.country].filter(Boolean).join(' • ') || 'No details',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const supplier = value as SuppliersDto;

    return [
      this.createFieldsSection('Supplier profile', [
        { label: 'Supplier ID', value: supplier.supplierID },
        { label: 'Company', value: supplier.companyName },
        { label: 'Contact', value: supplier.contactName },
        { label: 'Title', value: supplier.contactTitle },
      ]),
      this.createFieldsSection('Address and phone', [
        { label: 'Address', value: supplier.address },
        { label: 'City', value: supplier.city },
        { label: 'Region', value: supplier.region },
        { label: 'Country', value: supplier.country },
        { label: 'Phone', value: supplier.phone },
      ]),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Supplier', 'Supplier ID', value);
  }
}
