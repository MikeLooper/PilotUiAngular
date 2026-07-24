import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ApiConfiguration } from '../generated';
import { APP_ENV } from '../../core/config/app-config';

export function provideApiClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ApiConfiguration,
      useFactory: (): ApiConfiguration => {
        const env = inject(APP_ENV);
        const configuration = new ApiConfiguration();
        configuration.rootUrl = env.apiBaseUrl.replace(/\/$/, '');
        return configuration;
      },
    },
  ]);
}
