import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_ENV } from '../config/app-config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);

  const request = req.clone({
    setHeaders: {
      ApiVersion: env.apiVersion,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return next(request);
};
