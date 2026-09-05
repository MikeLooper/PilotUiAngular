import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { DOMAIN_API_VERSION_SEGMENT } from '../../api/facades/domain-api-client';
import { APP_ENV } from '../config/app-config';
import { SecurityTokenService } from '../services/security-token';

const DOMAIN_URL_SEGMENT = `/${DOMAIN_API_VERSION_SEGMENT}/`;

/**
 * Applies a bearer token to domain endpoints only (About/Healthcheck stay
 * unauthenticated, matching the OpenAPI spec's security scopes). No-ops
 * entirely when security-token config is inactive.
 */
export const securityTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  if (!env.securityToken.active || !req.url.includes(DOMAIN_URL_SEGMENT)) {
    return next(req);
  }

  const securityTokenService = inject(SecurityTokenService);

  return securityTokenService.getToken().pipe(
    switchMap((token) => {
      const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
      return next(request);
    })
  );
};
