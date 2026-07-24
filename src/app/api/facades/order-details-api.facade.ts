import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  OrderDetailsDto,
  orderDetailsAddPost,
  orderDetailsDeleteProductProductIdOrderOrderIdDelete,
  orderDetailsGetAllGet,
  orderDetailsGetProductProductIdOrderOrderIdGet,
  orderDetailsUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class OrderDetailsApiFacade extends BaseResourceApiFacade<OrderDetailsDto> {
  public getAll(forceRefresh = false): Observable<readonly OrderDetailsDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(productId: number | string, orderId: number | string): Observable<OrderDetailsDto> {
    return this.apiClient.invoke(orderDetailsGetProductProductIdOrderOrderIdGet, {
      productId,
      orderId,
    });
  }

  public add(orderDetail: OrderDetailsDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(orderDetailsAddPost, { body: orderDetail }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(orderDetail: OrderDetailsDto): Observable<void> {
    return this.apiClient.invoke(orderDetailsUpdatePut, { body: orderDetail }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(productId: number | string, orderId: number | string): Observable<void> {
    return this.apiClient.invoke(orderDetailsDeleteProductProductIdOrderOrderIdDelete, {
      productId,
      orderId,
    }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly OrderDetailsDto[]> {
    return this.apiClient.invoke(orderDetailsGetAllGet);
  }
}
