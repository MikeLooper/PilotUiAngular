import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { APP_ENV } from '../config/app-config';
import { LoggerService } from '../services/logger';
import { newGuid } from '../utils/guid';
import { CALLER_NAME_HEADER } from './caller-name-interceptor';
import { CORRELATION_ID_HEADER } from './correlation-id-interceptor';
import { isTargetApiUrl } from './domain-request';

/** Identifying details written with every API call log entry. */
export interface ApiCallLogContext {
  /** Unique per HTTP call; distinguishes calls that share a correlation id. Not sent to the API. */
  readonly requestId: string;
  readonly correlationId: string | null;
  readonly callerName: string | null;
  readonly method: string;
  readonly url: string;
}

/** Details written when an API call ends, whether it succeeded, failed, or was cancelled. */
export interface ApiCallEndLogDetails extends ApiCallLogContext {
  readonly status: number | null;
  readonly durationMs: number;
  readonly error?: unknown;
}

/**
 * Logs the beginning and end of every target API call (domain and system endpoints),
 * tagged with the request id, correlation id, and caller name. Registered last in the
 * interceptor chain so it sees the headers as sent and the raw HTTP outcome.
 */
export const apiLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  if (!isTargetApiUrl(req.url, env)) {
    return next(req);
  }

  const logger = inject(LoggerService);
  const context: ApiCallLogContext = {
    requestId: newGuid(),
    correlationId: req.headers.get(CORRELATION_ID_HEADER),
    callerName: req.headers.get(CALLER_NAME_HEADER),
    method: req.method,
    url: req.urlWithParams,
  };
  const label = `${context.method} ${context.url}`;
  const startedAt = performance.now();
  const endDetails = (status: number | null, error?: unknown): ApiCallEndLogDetails => ({
    ...context,
    status,
    durationMs: Math.round(performance.now() - startedAt),
    ...(error === undefined ? {} : { error }),
  });
  let ended = false;

  logger.info(`API call started: ${label}`, context);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          ended = true;
          logger.info(`API call completed: ${label}`, endDetails(event.status));
        }
      },
      error: (error: unknown) => {
        ended = true;
        const status = error instanceof HttpErrorResponse ? error.status : null;
        logger.error(`API call failed: ${label}`, endDetails(status, error));
      },
    }),
    finalize(() => {
      if (!ended) {
        logger.warn(`API call cancelled: ${label}`, endDetails(null));
      }
    }),
  );
};
