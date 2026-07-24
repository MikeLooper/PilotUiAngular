import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, healthcheckGet } from '../generated';

@Injectable({ providedIn: 'root' })
export class SystemApiFacade {
  private readonly apiClient = inject(ApiClient);

  public getHealthcheck(): Observable<string> {
    return this.apiClient.invoke(healthcheckGet);
  }
}
