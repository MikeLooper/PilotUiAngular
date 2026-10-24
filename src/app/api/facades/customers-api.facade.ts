import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseString,
  CustomersDto,
  v1CustomersAddPost,
  v1CustomersDeleteCustomerIdDelete,
  v1CustomersGetAllGet,
  v1CustomersGetCustomerIdGet,
  v1CustomersUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class CustomersApiFacade extends BaseResourceApiFacade<CustomersDto> {
  public getAll(forceRefresh = false): Observable<readonly CustomersDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(customerId: string): Observable<CustomersDto> {
    return this.apiClient.invoke(v1CustomersGetCustomerIdGet, { customerId });
  }

  public add(customer: CustomersDto): Observable<AddResponseString> {
    return this.apiClient.invoke(v1CustomersAddPost, { body: customer }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(customer: CustomersDto): Observable<void> {
    return this.apiClient.invoke(v1CustomersUpdatePut, { body: customer }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(customerId: string): Observable<void> {
    return this.apiClient.invoke(v1CustomersDeleteCustomerIdDelete, { customerId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly CustomersDto[]> {
    return this.apiClient.invoke(v1CustomersGetAllGet);
  }
}
