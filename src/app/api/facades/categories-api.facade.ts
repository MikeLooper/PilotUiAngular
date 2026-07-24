import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { ApiClient, categoriesGetAllGet } from '../generated';
import { CategoryListItem } from '../../features/home/models/category-list-item';
import { mapCategoryDtoToListItem } from '../mappers/category.mapper';

@Injectable({ providedIn: 'root' })
export class CategoriesApiFacade {
  private readonly apiClient = inject(ApiClient);
  private cachedCategories$?: Observable<readonly CategoryListItem[]>;

  public getAll(forceRefresh = false): Observable<readonly CategoryListItem[]> {
    if (forceRefresh || !this.cachedCategories$) {
      this.cachedCategories$ = this.apiClient.invoke(categoriesGetAllGet).pipe(
        map((response) => response.map(mapCategoryDtoToListItem)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }

    return this.cachedCategories$;
  }
}
