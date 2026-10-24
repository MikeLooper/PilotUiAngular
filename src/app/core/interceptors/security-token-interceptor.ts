import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { APP_ENV } from '../config/app-config';
import { SecurityTokenService } from '../services/security-token';
import { isDomainApiUrl } from './domain-request';

/**
 * Applies a bearer token to domain endpoints only (About/Healthcheck stay
 * unauthenticated, matching the OpenAPI spec's security scopes). No-ops
 * entirely when security-token config is inactive.
 */
export const securityTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  if (!env.securityToken.active || !isDomainApiUrl(req.url)) {
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
