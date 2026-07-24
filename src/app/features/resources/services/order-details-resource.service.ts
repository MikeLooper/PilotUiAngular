import { Injectable } from '@angular/core';
import { OrderDetailsApiFacade } from '../../../api/facades/order-details-api.facade';
import { OrderDetailsDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class OrderDetailsResourceService extends CrudResourceStateService<OrderDetailsDto> {
  public constructor(orderDetailsApiFacade: OrderDetailsApiFacade) {
    super('OrderDetails', {
      loadAll: () => orderDetailsApiFacade.getAll(true),
      getById: (id, secondId) => orderDetailsApiFacade.getById(id, secondId ?? ''),
      add: (dto) => orderDetailsApiFacade.add(dto),
      update: (dto) => orderDetailsApiFacade.update(dto),
      delete: (id, secondId) => orderDetailsApiFacade.delete(id, secondId ?? ''),
    });
  }
}
