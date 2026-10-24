import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  OrdersDto,
  v1OrdersAddPost,
  v1OrdersDeleteOrderIdDelete,
  v1OrdersGetAllGet,
  v1OrdersGetOrderIdGet,
  v1OrdersUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class OrdersApiFacade extends BaseResourceApiFacade<OrdersDto> {
  public getAll(forceRefresh = false): Observable<readonly OrdersDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(orderId: number | string): Observable<OrdersDto> {
    return this.apiClient.invoke(v1OrdersGetOrderIdGet, { orderId });
  }

  public add(order: OrdersDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(v1OrdersAddPost, { body: order }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(order: OrdersDto): Observable<void> {
    return this.apiClient.invoke(v1OrdersUpdatePut, { body: order }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(orderId: number | string): Observable<void> {
    return this.apiClient.invoke(v1OrdersDeleteOrderIdDelete, { orderId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly OrdersDto[]> {
    return this.apiClient.invoke(v1OrdersGetAllGet);
  }
}
