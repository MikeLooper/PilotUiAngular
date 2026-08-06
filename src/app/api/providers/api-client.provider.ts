import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ApiConfiguration } from '../generated';
import { APP_ENV } from '../../core/config/app-config';
import { DEFAULT_DATA_SOURCE, getDataSourceApiBaseUrl } from '../../core/config/data-sources';

export function provideApiClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ApiConfiguration,
      useFactory: (): ApiConfiguration => {
        const env = inject(APP_ENV);
        const configuration = new ApiConfiguration();
        configuration.rootUrl = getDataSourceApiBaseUrl(
          DEFAULT_DATA_SOURCE.basePort,
          env.apiBaseUrl
        );
        return configuration;
      },
    },
  ]);
}
