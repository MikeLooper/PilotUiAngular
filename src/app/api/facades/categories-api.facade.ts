import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  CategoriesDto,
  categoriesAddPost,
  categoriesDeleteCategoryIdDelete,
  categoriesGetAllGet,
  categoriesGetCategoryIdGet,
  categoriesUpdatePut,
} from '../generated';
import { CategoryListItem } from '../../features/home/models/category-list-item';
import { mapCategoryDtoToListItem } from '../mappers/category.mapper';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class CategoriesApiFacade extends BaseResourceApiFacade<CategoriesDto> {
  public getAllDtos(forceRefresh = false): Observable<readonly CategoriesDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getAll(forceRefresh = false): Observable<readonly CategoryListItem[]> {
    return this.getAllDtos(forceRefresh).pipe(map((response) => response.map(mapCategoryDtoToListItem)));
  }

  public getById(categoryId: number | string): Observable<CategoriesDto> {
    return this.apiClient.invoke(categoriesGetCategoryIdGet, { categoryId });
  }

  public add(category: CategoriesDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(categoriesAddPost, { body: category }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(category: CategoriesDto): Observable<void> {
    return this.apiClient.invoke(categoriesUpdatePut, { body: category }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(categoryId: number | string): Observable<void> {
    return this.apiClient.invoke(categoriesDeleteCategoryIdDelete, { categoryId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly CategoriesDto[]> {
    return this.apiClient.invoke(categoriesGetAllGet);
  }
}
