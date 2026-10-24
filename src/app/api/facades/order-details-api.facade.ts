import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseOrderDetails,
  OrderDetailsDto,
  v1OrderDetailsAddPost,
  v1OrderDetailsDeleteProductProductIdOrderOrderIdDelete,
  v1OrderDetailsGetAllGet,
  v1OrderDetailsGetProductProductIdOrderOrderIdGet,
  v1OrderDetailsUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class OrderDetailsApiFacade extends BaseResourceApiFacade<OrderDetailsDto> {
  public getAll(forceRefresh = false): Observable<readonly OrderDetailsDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(productId: number | string, orderId: number | string): Observable<OrderDetailsDto> {
    return this.apiClient.invoke(v1OrderDetailsGetProductProductIdOrderOrderIdGet, {
      productId,
      orderId,
    });
  }

  public add(orderDetail: OrderDetailsDto): Observable<AddResponseOrderDetails> {
    return this.apiClient.invoke(v1OrderDetailsAddPost, { body: orderDetail }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(orderDetail: OrderDetailsDto): Observable<void> {
    return this.apiClient.invoke(v1OrderDetailsUpdatePut, { body: orderDetail }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(productId: number | string, orderId: number | string): Observable<void> {
    return this.apiClient.invoke(v1OrderDetailsDeleteProductProductIdOrderOrderIdDelete, {
      productId,
      orderId,
    }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly OrderDetailsDto[]> {
    return this.apiClient.invoke(v1OrderDetailsGetAllGet);
  }
}
