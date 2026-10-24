import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const request = req.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return next(request);
};
