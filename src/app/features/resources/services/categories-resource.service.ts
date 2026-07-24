import { Injectable } from '@angular/core';
import { CategoriesApiFacade } from '../../../api/facades/categories-api.facade';
import { CategoriesDto } from '../../../api/generated';
import { CrudResourceStateService } from './crud-resource-state.service';

@Injectable({ providedIn: 'root' })
export class CategoriesResourceService extends CrudResourceStateService<CategoriesDto> {
  public constructor(categoriesApiFacade: CategoriesApiFacade) {
    super('Categories', {
      loadAll: () => categoriesApiFacade.getAllDtos(true),
      getById: (id) => categoriesApiFacade.getById(id),
      add: (dto) => categoriesApiFacade.add(dto),
      update: (dto) => categoriesApiFacade.update(dto),
      delete: (id) => categoriesApiFacade.delete(id),
    });
  }
}
