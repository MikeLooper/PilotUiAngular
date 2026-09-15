import { AppEnvironment } from '../app/core/config/app-config';
import { sourceApiConnections } from './source-api-connections';

export const environment: AppEnvironment = {
  production: true,
  // Nginx proxies /api/<port> to the API containers on the pilot-net network.
  apiBaseUrl: '/api',
  sourceApiConnections,
  apiVersion: '1.1',
  requestTimeoutMs: 15000,
  securityToken: {
    active: true,
    // Resolved on the pilot-net Docker network, alongside the API containers.
    baseUrl: 'http://localhost:55001',
    realm: 'local-realm',
    clientId: 'local-client',
    // Username/password are loaded at runtime from /security-token-secrets.json (see SecurityTokenService).
  },
};
