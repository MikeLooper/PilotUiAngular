import { AppEnvironment } from '../app/core/config/app-config';
import { sourceApiConnections } from './source-api-connections';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '/api',
  sourceApiConnections,
  apiVersion: '1.1',
  requestTimeoutMs: 15000,
  securityToken: {
    active: true,
    // Relative path proxied to Keycloak by proxy.conf.json, so the browser's token
    // request stays same-origin and avoids Keycloak's CORS restrictions on :4200.
    baseUrl: '/idp',
    realm: 'local-realm',
    clientId: 'local-client',
    // Username/password are loaded at runtime from /security-token-secrets.json (see SecurityTokenService).
  },
};
