import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AboutResponse, ApiClient, aboutGet, healthcheckGet } from '../generated';

@Injectable({ providedIn: 'root' })
export class SystemApiFacade {
  private readonly apiClient = inject(ApiClient);

  public getHealthcheck(): Observable<string> {
    return this.apiClient.invoke(healthcheckGet);
  }

  public getAbout(showDetails = true): Observable<AboutResponse> {
    return this.apiClient.invoke(aboutGet, { 'show-details': showDetails });
  }
}
