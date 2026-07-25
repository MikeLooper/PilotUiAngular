import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  ShippersDto,
  shippersAddPost,
  shippersDeleteShipperIdDelete,
  shippersGetAllGet,
  shippersGetShipperIdGet,
  shippersUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class ShippersApiFacade extends BaseResourceApiFacade<ShippersDto> {
  public getAll(forceRefresh = false): Observable<readonly ShippersDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(shipperId: number | string): Observable<ShippersDto> {
    return this.apiClient.invoke(shippersGetShipperIdGet, { shipperId });
  }

  public add(shipper: ShippersDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(shippersAddPost, { body: shipper }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(shipper: ShippersDto): Observable<void> {
    return this.apiClient.invoke(shippersUpdatePut, { body: shipper }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(shipperId: number | string): Observable<void> {
    return this.apiClient.invoke(shippersDeleteShipperIdDelete, { shipperId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly ShippersDto[]> {
    return this.apiClient.invoke(shippersGetAllGet);
  }
}
