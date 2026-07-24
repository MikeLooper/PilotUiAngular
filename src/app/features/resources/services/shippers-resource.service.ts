import { Injectable } from '@angular/core';
import { ShippersApiFacade } from '../../../api/facades/shippers-api.facade';
import { ShippersDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class ShippersResourceService extends CrudResourceStateService<ShippersDto> {
  public constructor(shippersApiFacade: ShippersApiFacade) {
    super('Shippers', {
      loadAll: () => shippersApiFacade.getAll(true),
      getById: (id) => shippersApiFacade.getById(id),
      add: (dto) => shippersApiFacade.add(dto),
      update: (dto) => shippersApiFacade.update(dto),
      delete: (id) => shippersApiFacade.delete(id),
    });
  }
}
