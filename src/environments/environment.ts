import { AppEnvironment } from '../app/core/config/app-config';

export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'http://localhost:55501',
  sourceApiConnections: {
    'dotnet-sqlserver': { hostname: 'localhost', port: 55501 },
    'dotnet-postgresql': { hostname: 'localhost', port: 55601 },
    'java-sqlserver': { hostname: 'localhost', port: 56601 },
    'java-postgresql': { hostname: 'localhost', port: 56701 },
  },
  apiVersion: '1.0',
  requestTimeoutMs: 15000,
};
