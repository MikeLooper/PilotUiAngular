import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ApiConfiguration } from '../generated';
import { APP_ENV } from '../../core/config/app-config';
import { buildDataSourceOptions, getDataSourceApiBaseUrl } from '../../core/config/data-sources';

export function provideApiClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ApiConfiguration,
      useFactory: (): ApiConfiguration => {
        const env = inject(APP_ENV);
        const dataSources = buildDataSourceOptions(env);
        const defaultDataSource = dataSources[0]!;
        const configuration = new ApiConfiguration();
        configuration.rootUrl = getDataSourceApiBaseUrl(defaultDataSource, env.apiBaseUrl);
        return configuration;
      },
    },
  ]);
}
