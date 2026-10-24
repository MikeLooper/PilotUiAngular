import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  EmployeesDto,
  v1EmployeesAddPost,
  v1EmployeesDeleteEmployeeIdDelete,
  v1EmployeesGetAllGet,
  v1EmployeesGetEmployeeIdGet,
  v1EmployeesUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class EmployeesApiFacade extends BaseResourceApiFacade<EmployeesDto> {
  public getAll(forceRefresh = false): Observable<readonly EmployeesDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(employeeId: number | string): Observable<EmployeesDto> {
    return this.apiClient.invoke(v1EmployeesGetEmployeeIdGet, { employeeId });
  }

  public add(employee: EmployeesDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(v1EmployeesAddPost, { body: employee }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(employee: EmployeesDto): Observable<void> {
    return this.apiClient.invoke(v1EmployeesUpdatePut, { body: employee }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(employeeId: number | string): Observable<void> {
    return this.apiClient.invoke(v1EmployeesDeleteEmployeeIdDelete, { employeeId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly EmployeesDto[]> {
    return this.apiClient.invoke(v1EmployeesGetAllGet);
  }
}
