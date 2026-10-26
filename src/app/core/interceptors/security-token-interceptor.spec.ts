import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';

import { environment } from '../../../environments/environment.development';
import { APP_ENV, SecurityTokenConfig } from '../config/app-config';
import { SecurityTokenService } from '../services/security-token';
import { securityTokenInterceptor } from './security-token-interceptor';

const DOMAIN_URL = 'http://localhost:53060/v1/categories';
const SYSTEM_URL = 'http://localhost:53060/about';
const ACTIVE_CONFIG: SecurityTokenConfig = {
  active: true,
  baseUrl: 'http://localhost:11141',
  realm: 'local-realm',
  clientId: 'local-client',
};

describe('securityTokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let getToken: Mock<() => Observable<string | null>>;

  function configure(securityToken: SecurityTokenConfig): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([securityTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: { ...environment, securityToken } },
        {
          provide: SecurityTokenService,
          useValue: { getToken } satisfies Partial<SecurityTokenService>,
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    getToken = vi.fn(() => of<string | null>('abc123'));
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('when the security token config is active', () => {
    beforeEach(() => {
      configure(ACTIVE_CONFIG);
    });

    it('adds a bearer Authorization header to domain requests', () => {
      http.get(DOMAIN_URL).subscribe();

      const request = httpMock.expectOne(DOMAIN_URL);
      request.flush({});

      expect(request.request.headers.get('Authorization')).toBe('Bearer abc123');
    });

    it('leaves domain requests unmodified when no token is available', () => {
      getToken.mockReturnValue(of(null));

      http.get(DOMAIN_URL).subscribe();

      const request = httpMock.expectOne(DOMAIN_URL);
      request.flush({});

      expect(request.request.headers.has('Authorization')).toBe(false);
    });

    it('does not request a token or add the header for system requests', () => {
      http.get(SYSTEM_URL).subscribe();

      const request = httpMock.expectOne(SYSTEM_URL);
      request.flush({});

      expect(request.request.headers.has('Authorization')).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
    });
  });

  describe('when the security token config is inactive', () => {
    beforeEach(() => {
      configure({ ...ACTIVE_CONFIG, active: false });
    });

    it('does not request a token or add the header for domain requests', () => {
      http.get(DOMAIN_URL).subscribe();

      const request = httpMock.expectOne(DOMAIN_URL);
      request.flush({});

      expect(request.request.headers.has('Authorization')).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
    });
  });
});
