import { environment } from '../../../environments/environment.development';
import { AppEnvironment } from '../config/app-config';
import { isDomainApiUrl, isTargetApiUrl } from './domain-request';

describe('domain-request', () => {
  describe('isDomainApiUrl', () => {
    it.each([
      { url: 'http://localhost:11001/v1/categories/get-all', expected: true },
      { url: '/api/11201/v1/orders/get/10248', expected: true },
      { url: 'http://localhost:11001/about', expected: false },
      { url: 'http://localhost:11001/healthcheck', expected: false },
      { url: 'http://localhost:11001/v1', expected: false },
      { url: '', expected: false },
    ])('returns $expected for "$url"', ({ url, expected }) => {
      const result = isDomainApiUrl(url);

      expect(result).toBe(expected);
    });
  });

  describe('isTargetApiUrl', () => {
    describe('with a relative proxy base URL', () => {
      const appEnvironment: AppEnvironment = { ...environment, apiBaseUrl: '/api' };

      it.each([
        { url: '/api/11001/v1/categories/get-all', expected: true },
        { url: '/api/11501/about', expected: true },
        { url: '/api/9999/about', expected: false },
        { url: '/api/11001', expected: false },
        { url: '/idp/realms/local-realm/protocol/openid-connect/token', expected: false },
        { url: '/security-token-secrets.json', expected: false },
      ])('returns $expected for "$url"', ({ url, expected }) => {
        const result = isTargetApiUrl(url, appEnvironment);

        expect(result).toBe(expected);
      });
    });

    describe('with an absolute base URL', () => {
      const appEnvironment: AppEnvironment = {
        ...environment,
        apiBaseUrl: 'http://localhost:4200',
      };

      it.each([
        { url: 'http://localhost:11201/v1/orders/get-all', expected: true },
        { url: 'http://localhost:11201/healthcheck', expected: true },
        { url: '/api/11201/healthcheck', expected: false },
        { url: 'http://localhost:4200/about', expected: false },
      ])('returns $expected for "$url"', ({ url, expected }) => {
        const result = isTargetApiUrl(url, appEnvironment);

        expect(result).toBe(expected);
      });
    });
  });
});
