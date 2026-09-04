import { InjectionToken, Provider } from '@angular/core';

export type SourceApiId =
  | 'dotnet-sqlserver'
  | 'dotnet-postgresql'
  | 'java-sqlserver'
  | 'java-postgresql'
  | 'python-sqlserver'
  | 'python-postgresql';

export interface SourceApiConnection {
  readonly hostname: string;
  readonly port: number;
}

export type SourceApiConnections = Readonly<Record<SourceApiId, SourceApiConnection>>;

export interface SecurityTokenConfig {
  /** When false, no token is fetched and no Authorization header is applied to domain requests. */
  readonly active: boolean;
  readonly baseUrl: string;
  readonly realm: string;
  readonly clientId: string;
}

/**
 * Credentials for the resource-owner-password-credentials grant, loaded at runtime from
 * /security-token-secrets.json rather than built into the environment files, so they can
 * be replaced without a rebuild during deployment.
 */
export interface SecurityTokenSecrets {
  readonly username: string;
  readonly password: string;
}

export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly sourceApiConnections: SourceApiConnections;
  readonly apiVersion: string;
  readonly requestTimeoutMs: number;
  readonly securityToken: SecurityTokenConfig;
}

export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');

export function provideAppEnvironment(environment: AppEnvironment): Provider {
  return {
    provide: APP_ENV,
    useValue: environment,
  };
}
