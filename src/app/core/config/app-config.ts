import { InjectionToken, Provider } from '@angular/core';

export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly apiVersion: string;
  readonly requestTimeoutMs: number;
}

export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');

export function provideAppEnvironment(environment: AppEnvironment): Provider {
  return {
    provide: APP_ENV,
    useValue: environment,
  };
}
