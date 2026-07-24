import { AppEnvironment } from '../app/core/config/app-config';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:53060',
  apiVersion: '1.0',
  requestTimeoutMs: 15000,
};
