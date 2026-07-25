import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  SuppliersDto,
  suppliersAddPost,
  suppliersDeleteSupplierIdDelete,
  suppliersGetAllGet,
  suppliersGetSupplierIdGet,
  suppliersUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class SuppliersApiFacade extends BaseResourceApiFacade<SuppliersDto> {
  public getAll(forceRefresh = false): Observable<readonly SuppliersDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(supplierId: number | string): Observable<SuppliersDto> {
    return this.apiClient.invoke(suppliersGetSupplierIdGet, { supplierId });
  }

  public add(supplier: SuppliersDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(suppliersAddPost, { body: supplier }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(supplier: SuppliersDto): Observable<void> {
    return this.apiClient.invoke(suppliersUpdatePut, { body: supplier }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(supplierId: number | string): Observable<void> {
    return this.apiClient.invoke(suppliersDeleteSupplierIdDelete, { supplierId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly SuppliersDto[]> {
    return this.apiClient.invoke(suppliersGetAllGet);
  }
}
