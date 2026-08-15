import { InjectionToken, Provider } from '@angular/core';

export type SourceApiId =
  | 'dotnet-sqlserver'
  | 'dotnet-postgresql'
  | 'java-sqlserver'
  | 'java-postgresql';

export interface SourceApiConnection {
  readonly hostname: string;
  readonly port: number;
}

export type SourceApiConnections = Readonly<Record<SourceApiId, SourceApiConnection>>;

export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly sourceApiConnections: SourceApiConnections;
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
