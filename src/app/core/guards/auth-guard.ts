import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { APP_ENV } from '../config/app-config';

export const authGuard: CanActivateFn = (_route, _state) => {
  const env = inject(APP_ENV);
  return env.apiBaseUrl.length > 0;
};
