import { Injectable } from '@angular/core';
import { CustomersApiFacade } from '../../../api/facades/customers-api.facade';
import { CustomersDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class CustomersResourceService extends CrudResourceStateService<CustomersDto> {
  public constructor(customersApiFacade: CustomersApiFacade) {
    super('Customers', {
      loadAll: () => customersApiFacade.getAll(true),
      getById: (id) => customersApiFacade.getById(String(id)),
      add: (dto) => customersApiFacade.add(dto),
      update: (dto) => customersApiFacade.update(dto),
      delete: (id) => customersApiFacade.delete(String(id)),
    });
  }
}
