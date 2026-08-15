import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

import { authInterceptor } from './auth-interceptor';
import { APP_ENV } from '../config/app-config';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENV,
          useValue: {
            production: false,
            apiBaseUrl: 'http://localhost:53060',
            sourceApiConnections: {
              'dotnet-sqlserver': { hostname: 'localhost', port: 55501 },
              'dotnet-postgresql': { hostname: 'localhost', port: 55601 },
              'java-sqlserver': { hostname: 'localhost', port: 56601 },
              'java-postgresql': { hostname: 'localhost', port: 56701 },
            },
            apiVersion: '1.0',
            requestTimeoutMs: 15000,
          },
        },
      ],
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
