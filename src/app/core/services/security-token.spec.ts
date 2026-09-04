import { HttpParams, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SecurityTokenService } from './security-token';
import { APP_ENV, SecurityTokenConfig } from '../config/app-config';
import { environment } from '../../../environments/environment.development';

const SECRETS_URL = '/security-token-secrets.json';
const TOKEN_URL = 'http://localhost:55001/realms/local-realm/protocol/openid-connect/token';
const secrets = { username: 'working_admin_user', password: 'super-secret' };

function configure(securityToken: SecurityTokenConfig): void {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: APP_ENV,
        useValue: { ...environment, securityToken },
      },
    ],
  });
}

describe('SecurityTokenService', () => {
  let httpMock: HttpTestingController;

  const activeConfig: SecurityTokenConfig = {
    active: true,
    baseUrl: 'http://localhost:55001',
    realm: 'local-realm',
    clientId: 'local-client',
  };

  afterEach(() => {
    httpMock.verify();
  });

  it('does not fetch a token when inactive', () => {
    configure({ ...activeConfig, active: false });
    httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(SecurityTokenService);

    let token: string | null = 'unset';
    service.getToken().subscribe((result) => (token = result));

    expect(token).toBeNull();
    httpMock.expectNone(SECRETS_URL);
    httpMock.expectNone(TOKEN_URL);
  });

  it('fetches a token via the password grant when active', () => {
    configure(activeConfig);
    httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(SecurityTokenService);

    let token: string | null = null;
    service.getToken().subscribe((result) => (token = result));

    httpMock.expectOne(SECRETS_URL).flush(secrets);

    const request = httpMock.expectOne(TOKEN_URL);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as HttpParams;
    expect(body.get('grant_type')).toBe('password');
    expect(body.get('client_id')).toBe('local-client');
    expect(body.get('username')).toBe('working_admin_user');
    expect(body.get('password')).toBe('super-secret');

    request.flush({ access_token: 'abc123', expires_in: 300 });

    expect(token).toBe('abc123');
  });

  it('reuses a cached token until it expires', () => {
    configure(activeConfig);
    httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(SecurityTokenService);

    service.getToken().subscribe();
    httpMock.expectOne(SECRETS_URL).flush(secrets);
    httpMock.expectOne(TOKEN_URL).flush({ access_token: 'abc123', expires_in: 300 });

    let token: string | null = null;
    service.getToken().subscribe((result) => (token = result));

    expect(token).toBe('abc123');
    httpMock.expectNone(SECRETS_URL);
    httpMock.expectNone(TOKEN_URL);
  });

  it('resolves to null and does not cache when the IDP request fails', () => {
    configure(activeConfig);
    httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(SecurityTokenService);

    let token: string | null = 'unset';
    service.getToken().subscribe((result) => (token = result));

    httpMock.expectOne(SECRETS_URL).flush(secrets);
    httpMock.expectOne(TOKEN_URL).flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(token).toBeNull();
  });

  it('shares a single in-flight request across concurrent callers', () => {
    configure(activeConfig);
    httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(SecurityTokenService);

    let tokenA: string | null = null;
    let tokenB: string | null = null;
    service.getToken().subscribe((result) => (tokenA = result));
    service.getToken().subscribe((result) => (tokenB = result));

    httpMock.expectOne(SECRETS_URL).flush(secrets);
    httpMock.expectOne(TOKEN_URL).flush({ access_token: 'abc123', expires_in: 300 });

    expect(tokenA).toBe('abc123');
    expect(tokenB).toBe('abc123');
  });
});
