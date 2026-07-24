import { Injectable } from '@angular/core';
import { CustomersApiFacade } from '../../../../api/facades/customers-api.facade';
import { CustomersDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class CustomersResourceVmFacade extends BaseResourceCrudVmFacade<CustomersDto> {
  public readonly key = 'customers' as const;

  public constructor(private readonly customersApiFacade: CustomersApiFacade) {
    super({
      heading: 'Customers API',
      description: 'Manage customers with paging and typed actions.',
      primaryIdLabel: 'Customer ID',
      defaultPrimaryId: 'ALFKI',
      pageDefaults: {
        initialPrimaryId: 'ALFKI',
        initialSearchTerm: 'alf',
        pageSize: 10,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.customersApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.customersApiFacade.getById(primaryId);
  }

  protected createSampleDto(): CustomersDto {
    return {
      customerID: 'NEW01',
      companyName: 'Sample Customer Co',
      contactName: 'Sample Contact',
      city: 'Seattle',
      country: 'USA',
    };
  }

  protected updateSampleDto(primaryId?: string): CustomersDto {
    return {
      customerID: primaryId || this.defaultPrimaryId,
      companyName: 'Updated Customer Co',
      contactName: 'Updated Contact',
      city: 'Portland',
      country: 'USA',
    };
  }

  protected addDto(dto: CustomersDto) {
    return this.customersApiFacade.add(dto);
  }

  protected updateDto(dto: CustomersDto) {
    return this.customersApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.customersApiFacade.delete(primaryId || this.defaultPrimaryId);
  }

  protected mapDtoToRecord(dto: CustomersDto): ResourceRecord {
    return {
      primaryId: String(dto.customerID ?? ''),
      title: dto.companyName?.trim() || 'Unnamed customer',
      subtitle: [dto.contactName, dto.city, dto.country].filter(Boolean).join(' • ') || 'No details',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const customer = value as CustomersDto;

    return [
      this.createFieldsSection('Customer profile', [
        { label: 'Customer ID', value: customer.customerID },
        { label: 'Company', value: customer.companyName },
        { label: 'Contact', value: customer.contactName },
        { label: 'Title', value: customer.contactTitle },
      ]),
      this.createFieldsSection('Location and phone', [
        { label: 'City', value: customer.city },
        { label: 'Region', value: customer.region },
        { label: 'Country', value: customer.country },
        { label: 'Phone', value: customer.phone },
      ]),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Customer', 'Customer ID', value);
  }
}
