import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { environment } from '../../../environments/environment.development';
import { APP_ENV, AppEnvironment } from '../config/app-config';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  function runGuard(apiBaseUrl: string): ReturnType<typeof authGuard> {
    const appEnvironment: AppEnvironment = { ...environment, apiBaseUrl };
    TestBed.configureTestingModule({ providers: [{ provide: APP_ENV, useValue: appEnvironment }] });

    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('allows activation when an API base URL is configured', () => {
    const result = runGuard('/api');

    expect(result).toBe(true);
  });

  it('blocks activation when the API base URL is empty', () => {
    const result = runGuard('');

    expect(result).toBe(false);
  });
});
