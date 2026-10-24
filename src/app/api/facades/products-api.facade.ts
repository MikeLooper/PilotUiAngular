import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  ProductsDto,
  v1ProductsAddPost,
  v1ProductsDeleteProductIdDelete,
  v1ProductsGetAllGet,
  v1ProductsGetProductIdGet,
  v1ProductsUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class ProductsApiFacade extends BaseResourceApiFacade<ProductsDto> {
  public getAll(forceRefresh = false): Observable<readonly ProductsDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(productId: number | string): Observable<ProductsDto> {
    return this.apiClient.invoke(v1ProductsGetProductIdGet, { productId });
  }

  public add(product: ProductsDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(v1ProductsAddPost, { body: product }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(product: ProductsDto): Observable<void> {
    return this.apiClient.invoke(v1ProductsUpdatePut, { body: product }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(productId: number | string): Observable<void> {
    return this.apiClient.invoke(v1ProductsDeleteProductIdDelete, { productId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly ProductsDto[]> {
    return this.apiClient.invoke(v1ProductsGetAllGet);
  }
}
