import { Injectable } from '@angular/core';
import { EmployeesApiFacade } from '../../../api/facades/employees-api.facade';
import { EmployeesDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class EmployeesResourceService extends CrudResourceStateService<EmployeesDto> {
  public constructor(employeesApiFacade: EmployeesApiFacade) {
    super('Employees', {
      loadAll: () => employeesApiFacade.getAll(true),
      getById: (id) => employeesApiFacade.getById(id),
      add: (dto) => employeesApiFacade.add(dto),
      update: (dto) => employeesApiFacade.update(dto),
      delete: (id) => employeesApiFacade.delete(id),
    });
  }
}
