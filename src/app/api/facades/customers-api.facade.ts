import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  CustomersDto,
  customersAddPost,
  customersDeleteCustomerIdDelete,
  customersGetAllGet,
  customersGetCustomerIdGet,
  customersUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class CustomersApiFacade extends BaseResourceApiFacade<CustomersDto> {
  public getAll(forceRefresh = false): Observable<readonly CustomersDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(customerId: string): Observable<CustomersDto> {
    return this.apiClient.invoke(customersGetCustomerIdGet, { customerId });
  }

  public add(customer: CustomersDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(customersAddPost, { body: customer }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(customer: CustomersDto): Observable<void> {
    return this.apiClient.invoke(customersUpdatePut, { body: customer }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(customerId: string): Observable<void> {
    return this.apiClient.invoke(customersDeleteCustomerIdDelete, { customerId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly CustomersDto[]> {
    return this.apiClient.invoke(customersGetAllGet);
  }
}
