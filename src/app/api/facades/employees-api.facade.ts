import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  AddResponseInt,
  EmployeesDto,
  employeesAddPost,
  employeesDeleteEmployeeIdDelete,
  employeesGetAllGet,
  employeesGetEmployeeIdGet,
  employeesUpdatePut,
} from '../generated';
import { BaseResourceApiFacade } from './base-resource-api.facade';

@Injectable({ providedIn: 'root' })
export class EmployeesApiFacade extends BaseResourceApiFacade<EmployeesDto> {
  public getAll(forceRefresh = false): Observable<readonly EmployeesDto[]> {
    return this.getAllCached(forceRefresh);
  }

  public getById(employeeId: number | string): Observable<EmployeesDto> {
    return this.apiClient.invoke(employeesGetEmployeeIdGet, { employeeId });
  }

  public add(employee: EmployeesDto): Observable<AddResponseInt> {
    return this.apiClient.invoke(employeesAddPost, { body: employee }).pipe(
      tap(() => this.clearCache())
    );
  }

  public update(employee: EmployeesDto): Observable<void> {
    return this.apiClient.invoke(employeesUpdatePut, { body: employee }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  public delete(employeeId: number | string): Observable<void> {
    return this.apiClient.invoke(employeesDeleteEmployeeIdDelete, { employeeId }).pipe(
      tap(() => this.clearCache()),
      map(() => undefined)
    );
  }

  protected fetchAll(): Observable<readonly EmployeesDto[]> {
    return this.apiClient.invoke(employeesGetAllGet);
  }
}
