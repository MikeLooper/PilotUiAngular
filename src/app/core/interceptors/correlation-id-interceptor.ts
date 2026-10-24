import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_ENV } from '../config/app-config';
import { isTargetApiUrl } from './domain-request';

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ensures every target API request (domain and system) carries a valid
 * X-Correlation-Id (UUID), as defined by the OpenAPI spec's CorrelationIdHeader
 * parameter. A valid value supplied by the caller is kept; a missing or
 * malformed one is replaced with a new GUID.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  if (!isTargetApiUrl(req.url, env) || UUID_PATTERN.test(req.headers.get(CORRELATION_ID_HEADER) ?? '')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { [CORRELATION_ID_HEADER]: newGuid() } }));
};

/**
 * crypto.randomUUID is only available in secure contexts (HTTPS/localhost),
 * so fall back to building a v4 UUID from crypto.getRandomValues.
 */
function newGuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // version 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
