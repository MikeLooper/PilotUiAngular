import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_ENV } from '../config/app-config';
import { isTargetApiUrl } from './domain-request';

export const CALLER_NAME_HEADER = 'X-Caller-Name';

/** Maximum length of the X-Caller-Name header, per the OpenAPI spec's CallerNameHeader parameter. */
export const CALLER_NAME_MAX_LENGTH = 100;

/**
 * Identifies this application to every target API request (domain and system endpoints
 * alike) through the OpenAPI spec's X-Caller-Name header. A non-blank value supplied by
 * the caller is kept; the header is always trimmed to the spec's maximum length.
 */
export const callerNameInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  if (!isTargetApiUrl(req.url, env)) {
    return next(req);
  }

  const callerName = req.headers.get(CALLER_NAME_HEADER)?.trim() || env.callerName;

  return next(
    req.clone({
      setHeaders: { [CALLER_NAME_HEADER]: callerName.slice(0, CALLER_NAME_MAX_LENGTH) },
    }),
  );
};
