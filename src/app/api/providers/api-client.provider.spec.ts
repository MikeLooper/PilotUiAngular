import { TestBed } from '@angular/core/testing';

import { ApiConfiguration } from '../generated';
import { APP_ENV, AppEnvironment } from '../../core/config/app-config';
import { environment } from '../../../environments/environment.development';
import { provideApiClient } from './api-client.provider';

describe('provideApiClient', () => {
  function configure(apiBaseUrl: string): ApiConfiguration {
    const appEnvironment: AppEnvironment = { ...environment, apiBaseUrl };
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ENV, useValue: appEnvironment }, provideApiClient()],
    });
    return TestBed.inject(ApiConfiguration);
  }

  it('points the root URL at the proxy path of the first data source for a relative base URL', () => {
    const configuration = configure('/api/');

    const rootUrl = configuration.rootUrl;

    expect(rootUrl).toBe('/api/11001');
  });

  it('points the root URL directly at the first data source for an absolute base URL', () => {
    const configuration = configure('http://localhost:4200');

    const rootUrl = configuration.rootUrl;

    expect(rootUrl).toBe('http://localhost:11001');
  });
});
