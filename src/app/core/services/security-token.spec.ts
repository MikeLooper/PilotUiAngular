import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { APP_ENV, SecurityTokenConfig } from '../config/app-config';
import { SecurityTokenService } from './security-token';

const SECRETS_URL = '/security-token-secrets.json';
const TOKEN_URL = 'http://localhost:11141/realms/local-realm/protocol/openid-connect/token';
const SECRETS = { username: 'working_admin_user', password: 'super-secret' };
const ACTIVE_CONFIG: SecurityTokenConfig = {
  active: true,
  baseUrl: 'http://localhost:11141',
  realm: 'local-realm',
  clientId: 'local-client',
};
const START_TIME = new Date('2026-01-01T00:00:00Z');

describe('SecurityTokenService', () => {
  let service: SecurityTokenService;
  let httpMock: HttpTestingController;

  function configure(securityToken: SecurityTokenConfig): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: { ...environment, securityToken } },
      ],
    });
    service = TestBed.inject(SecurityTokenService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  /** Answers the secrets and IDP requests for one token fetch. */
  function respondWithToken(accessToken: string, expiresInSeconds = 300): void {
    httpMock.expectOne(SECRETS_URL).flush(SECRETS);
    httpMock
      .expectOne(TOKEN_URL)
      .flush({ access_token: accessToken, expires_in: expiresInSeconds });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START_TIME);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getToken', () => {
    describe('when the security token config is inactive', () => {
      beforeEach(() => {
        configure({ ...ACTIVE_CONFIG, active: false });
      });

      it('emits null without contacting the IDP', async () => {
        const token = await lastValueFrom(service.getToken());

        expect(token).toBeNull();
        httpMock.expectNone(SECRETS_URL);
        httpMock.expectNone(TOKEN_URL);
      });
    });

    describe('when the security token config is active', () => {
      beforeEach(() => {
        configure(ACTIVE_CONFIG);
      });

      it('creates the service', () => {
        expect(service).toBeTruthy();
      });

      it('loads the secrets and posts a password grant to the IDP', () => {
        service.getToken().subscribe();

        httpMock.expectOne({ method: 'GET', url: SECRETS_URL }).flush(SECRETS);
        const request = httpMock.expectOne({ method: 'POST', url: TOKEN_URL });
        request.flush({ access_token: 'abc123', expires_in: 300 });

        const body = request.request.body as HttpParams;
        expect(body.get('grant_type')).toBe('password');
        expect(body.get('client_id')).toBe('local-client');
        expect(body.get('username')).toBe('working_admin_user');
        expect(body.get('password')).toBe('super-secret');
        expect(request.request.headers.get('Content-Type')).toBe(
          'application/x-www-form-urlencoded',
        );
      });

      it('emits the access token returned by the IDP', async () => {
        const token = lastValueFrom(service.getToken());

        respondWithToken('abc123');

        expect(await token).toBe('abc123');
      });

      it('reuses the cached token until shortly before it expires', async () => {
        const first = lastValueFrom(service.getToken());
        respondWithToken('abc123', 300);
        await first;
        vi.setSystemTime(START_TIME.getTime() + 294_000);

        const token = await lastValueFrom(service.getToken());

        expect(token).toBe('abc123');
        httpMock.expectNone(SECRETS_URL);
      });

      it('fetches a new token once the cached one is within the expiry buffer', async () => {
        const first = lastValueFrom(service.getToken());
        respondWithToken('abc123', 300);
        await first;
        vi.setSystemTime(START_TIME.getTime() + 295_000);

        const token = lastValueFrom(service.getToken());
        respondWithToken('def456');

        expect(await token).toBe('def456');
      });

      it('shares a single in-flight request across concurrent callers', async () => {
        const tokenA = lastValueFrom(service.getToken());
        const tokenB = lastValueFrom(service.getToken());

        respondWithToken('abc123');

        expect(await tokenA).toBe('abc123');
        expect(await tokenB).toBe('abc123');
      });

      it('emits null and logs when the IDP request fails', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const token = lastValueFrom(service.getToken());

        httpMock.expectOne(SECRETS_URL).flush(SECRETS);
        httpMock
          .expectOne(TOKEN_URL)
          .flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(await token).toBeNull();
        expect(consoleError).toHaveBeenCalledOnce();
      });

      it('emits null when the secrets file cannot be loaded', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const token = lastValueFrom(service.getToken());

        httpMock.expectOne(SECRETS_URL).flush(null, { status: 404, statusText: 'Not Found' });

        expect(await token).toBeNull();
        httpMock.expectNone(TOKEN_URL);
      });

      it('retries the IDP on the next call after a failure', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failed = lastValueFrom(service.getToken());
        httpMock.expectOne(SECRETS_URL).flush(SECRETS);
        httpMock.expectOne(TOKEN_URL).flush('error', { status: 500, statusText: 'Server Error' });
        await failed;

        const token = lastValueFrom(service.getToken());
        respondWithToken('abc123');

        expect(await token).toBe('abc123');
      });
    });

    describe('when the IDP base URL has a trailing slash', () => {
      beforeEach(() => {
        configure({ ...ACTIVE_CONFIG, baseUrl: 'http://localhost:11141//' });
      });

      it('builds the token URL without a doubled slash', async () => {
        const token = lastValueFrom(service.getToken());

        respondWithToken('abc123');

        expect(await token).toBe('abc123');
      });
    });
  });
});
