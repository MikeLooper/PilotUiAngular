import { AppEnvironment } from '../app/core/config/app-config';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '/api',
  apiVersion: '1.0',
  requestTimeoutMs: 15000,
};
