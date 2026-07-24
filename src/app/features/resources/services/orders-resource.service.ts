import { Injectable } from '@angular/core';
import { OrdersApiFacade } from '../../../api/facades/orders-api.facade';
import { OrdersDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class OrdersResourceService extends CrudResourceStateService<OrdersDto> {
  public constructor(ordersApiFacade: OrdersApiFacade) {
    super('Orders', {
      loadAll: () => ordersApiFacade.getAll(true),
      getById: (id) => ordersApiFacade.getById(id),
      add: (dto) => ordersApiFacade.add(dto),
      update: (dto) => ordersApiFacade.update(dto),
      delete: (id) => ordersApiFacade.delete(id),
    });
  }
}
