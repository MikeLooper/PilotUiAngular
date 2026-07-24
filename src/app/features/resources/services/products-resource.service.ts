import { Injectable } from '@angular/core';
import { ProductsApiFacade } from '../../../api/facades/products-api.facade';
import { ProductsDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class ProductsResourceService extends CrudResourceStateService<ProductsDto> {
  public constructor(productsApiFacade: ProductsApiFacade) {
    super('Products', {
      loadAll: () => productsApiFacade.getAll(true),
      getById: (id) => productsApiFacade.getById(id),
      add: (dto) => productsApiFacade.add(dto),
      update: (dto) => productsApiFacade.update(dto),
      delete: (id) => productsApiFacade.delete(id),
    });
  }
}
