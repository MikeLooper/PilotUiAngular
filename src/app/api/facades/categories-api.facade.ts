import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  CategoriesDto,
  v1CategoriesAddPost,
  v1CategoriesDeleteCategoryIdDelete,
  v1CategoriesGetAllGet,
  v1CategoriesGetCategoryIdGet,
  v1CategoriesUpdatePut,
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
    return this.apiClient.invoke(v1CategoriesGetCategoryIdGet, { categoryId });
  }

  public add(category: CategoriesDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(v1CategoriesAddPost, { body: category }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(category: CategoriesDto): Observable<void> {
    return this.apiClient.invoke(v1CategoriesUpdatePut, { body: category }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(categoryId: number | string): Observable<void> {
    return this.apiClient.invoke(v1CategoriesDeleteCategoryIdDelete, { categoryId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly CategoriesDto[]> {
    return this.apiClient.invoke(v1CategoriesGetAllGet);
  }
}
