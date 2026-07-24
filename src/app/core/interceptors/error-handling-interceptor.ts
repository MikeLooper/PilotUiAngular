import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorMapper } from '../errors/api-error.mapper';

export const errorHandlingInterceptor: HttpInterceptorFn = (req, next) => {
  const mapper = inject(ApiErrorMapper);

  return next(req).pipe(
    catchError((error: unknown) => throwError(() => mapper.toClientError(error)))
  );
};
