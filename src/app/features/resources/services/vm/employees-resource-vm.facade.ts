import { Injectable } from '@angular/core';
import { EmployeesApiFacade } from '../../../../api/facades/employees-api.facade';
import { EmployeesDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class EmployeesResourceVmFacade extends BaseResourceCrudVmFacade<EmployeesDto> {
  public readonly key = 'employees' as const;

  public constructor(private readonly employeesApiFacade: EmployeesApiFacade) {
    super({
      heading: 'Employees API',
      description: 'Manage employee records through typed feature state.',
      primaryIdLabel: 'Employee ID',
      defaultPrimaryId: '1',
      pageDefaults: {
        initialPrimaryId: '1',
        pageSize: 9,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.employeesApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.employeesApiFacade.getById(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected createSampleDto(): EmployeesDto {
    return {
      employeeID: 0,
      firstName: 'Sample',
      lastName: 'Employee',
      title: 'Representative',
      city: 'Seattle',
      country: 'USA',
    };
  }

  protected updateSampleDto(primaryId?: string): EmployeesDto {
    return {
      employeeID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      firstName: 'Updated',
      lastName: 'Employee',
      title: 'Senior Representative',
      city: 'Portland',
      country: 'USA',
    };
  }

  protected addDto(dto: EmployeesDto) {
    return this.employeesApiFacade.add(dto);
  }

  protected updateDto(dto: EmployeesDto) {
    return this.employeesApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.employeesApiFacade.delete(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected mapDtoToRecord(dto: EmployeesDto): ResourceRecord {
    return {
      primaryId: String(dto.employeeID),
      title: `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim() || 'Unnamed employee',
      subtitle: [dto.title, dto.city, dto.country].filter(Boolean).join(' • ') || 'No details',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const employee = value as EmployeesDto;

    return [
      this.createFieldsSection('Employee profile', [
        { label: 'Employee ID', value: employee.employeeID },
        { label: 'First name', value: employee.firstName },
        { label: 'Last name', value: employee.lastName },
        { label: 'Title', value: employee.title },
      ]),
      this.createFieldsSection('Work location', [
        { label: 'City', value: employee.city },
        { label: 'Region', value: employee.region },
        { label: 'Country', value: employee.country },
        { label: 'Extension', value: employee.extension },
      ]),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Employee', 'Employee ID', value);
  }
}
