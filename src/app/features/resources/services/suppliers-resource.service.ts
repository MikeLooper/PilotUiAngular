import { Injectable } from '@angular/core';
import { SuppliersApiFacade } from '../../../api/facades/suppliers-api.facade';
import { SuppliersDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class SuppliersResourceService extends CrudResourceStateService<SuppliersDto> {
  public constructor(suppliersApiFacade: SuppliersApiFacade) {
    super('Suppliers', {
      loadAll: () => suppliersApiFacade.getAll(true),
      getById: (id) => suppliersApiFacade.getById(id),
      add: (dto) => suppliersApiFacade.add(dto),
      update: (dto) => suppliersApiFacade.update(dto),
      delete: (id) => suppliersApiFacade.delete(id),
    });
  }
}
