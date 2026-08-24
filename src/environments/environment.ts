import { AppEnvironment } from '../app/core/config/app-config';
import { sourceApiConnections } from './source-api-connections';

export const environment: AppEnvironment = {
  production: true,
  // Nginx proxies /api/<port> to the API containers on the pilot-net network.
  apiBaseUrl: '/api',
  sourceApiConnections,
  apiVersion: '1.0',
  requestTimeoutMs: 15000,
};
