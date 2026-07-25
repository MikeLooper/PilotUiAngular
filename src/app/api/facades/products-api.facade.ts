import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  ProductsDto,
  productsAddPost,
  productsDeleteProductIdDelete,
  productsGetAllGet,
  productsGetProductIdGet,
  productsUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class ProductsApiFacade extends BaseResourceApiFacade<ProductsDto> {
  public getAll(forceRefresh = false): Observable<readonly ProductsDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(productId: number | string): Observable<ProductsDto> {
    return this.apiClient.invoke(productsGetProductIdGet, { productId });
  }

  public add(product: ProductsDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(productsAddPost, { body: product }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(product: ProductsDto): Observable<void> {
    return this.apiClient.invoke(productsUpdatePut, { body: product }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(productId: number | string): Observable<void> {
    return this.apiClient.invoke(productsDeleteProductIdDelete, { productId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly ProductsDto[]> {
    return this.apiClient.invoke(productsGetAllGet);
  }
}
