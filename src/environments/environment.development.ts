import { AppEnvironment } from '../app/core/config/app-config';
import { sourceApiConnections } from './source-api-connections';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '/api',
  sourceApiConnections,
  apiVersion: '1.0',
  requestTimeoutMs: 15000,
};
