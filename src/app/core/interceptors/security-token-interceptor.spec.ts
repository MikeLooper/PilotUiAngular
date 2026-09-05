import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { securityTokenInterceptor } from './security-token-interceptor';
import { APP_ENV, SecurityTokenConfig } from '../config/app-config';
import { SecurityTokenService } from '../services/security-token';
import { environment } from '../../../environments/environment.development';

const DOMAIN_URL = 'http://localhost:53060/v1/categories';
const SYSTEM_URL = 'http://localhost:53060/about';

function configure(securityToken: SecurityTokenConfig, tokenServiceStub: Partial<SecurityTokenService>): void {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([securityTokenInterceptor])),
      provideHttpClientTesting(),
      { provide: APP_ENV, useValue: { ...environment, securityToken } },
      { provide: SecurityTokenService, useValue: tokenServiceStub },
    ],
  });
}

describe('securityTokenInterceptor', () => {
  const activeConfig: SecurityTokenConfig = {
    active: true,
    baseUrl: 'http://localhost:55001',
    realm: 'local-realm',
    clientId: 'local-client',
  };

  let httpMock: HttpTestingController;

  afterEach(() => {
    httpMock.verify();
  });

  it('adds the Authorization header to domain requests when active', () => {
    configure(activeConfig, { getToken: () => of('abc123') });
    httpMock = TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpClient);

    http.get(DOMAIN_URL).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc123');
    request.flush({});
  });

  it('does not add the header to non-domain requests', () => {
    configure(activeConfig, { getToken: () => of('abc123') });
    httpMock = TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpClient);

    http.get(SYSTEM_URL).subscribe();

    const request = httpMock.expectOne(SYSTEM_URL);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('does not add the header when security-token config is inactive', () => {
    configure({ ...activeConfig, active: false }, { getToken: () => of('abc123') });
    httpMock = TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpClient);

    http.get(DOMAIN_URL).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('leaves the request unmodified when no token is available', () => {
    configure(activeConfig, { getToken: () => of(null) });
    httpMock = TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpClient);

    http.get(DOMAIN_URL).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
