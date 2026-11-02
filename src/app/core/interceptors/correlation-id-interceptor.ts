import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_ENV } from '../config/app-config';
import { isGuid, newGuid } from '../utils/guid';
import { isTargetApiUrl } from './domain-request';

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

/**
 * Ensures every target API request (domain and system endpoints alike) carries a
 * valid X-Correlation-Id (UUID), as defined by the OpenAPI spec's CorrelationIdHeader
 * parameter. A valid value supplied by the caller is kept; a missing or malformed one
 * is replaced with a new GUID.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  if (!isTargetApiUrl(req.url, env) || isGuid(req.headers.get(CORRELATION_ID_HEADER))) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { [CORRELATION_ID_HEADER]: newGuid() } }));
};
