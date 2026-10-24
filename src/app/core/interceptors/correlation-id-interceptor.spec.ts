import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CORRELATION_ID_HEADER, correlationIdInterceptor } from './correlation-id-interceptor';
import { APP_ENV } from '../config/app-config';
import { environment } from '../../../environments/environment.development';

const DOMAIN_URL = '/api/11201/v1/categories/get-all';
const SYSTEM_URL = '/api/11201/about';
const NON_TARGET_URL = '/idp/realms/local-realm/protocol/openid-connect/token';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('correlationIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds a new GUID to domain requests', () => {
    http.get(DOMAIN_URL).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toMatch(UUID_PATTERN);
    request.flush([]);
  });

  it('generates a distinct GUID per request', () => {
    http.get(DOMAIN_URL).subscribe();
    http.get(DOMAIN_URL).subscribe();

    const requests = httpMock.match(DOMAIN_URL);
    const ids = requests.map((r) => r.request.headers.get(CORRELATION_ID_HEADER));
    expect(requests.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
    requests.forEach((r) => r.flush([]));
  });

  it('keeps a valid caller-supplied correlation id', () => {
    const correlationId = '7ea2c7f7-8b46-475d-86f8-7aaaa9e4a35b';
    http.get(DOMAIN_URL, { headers: { [CORRELATION_ID_HEADER]: correlationId } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(correlationId);
    request.flush([]);
  });

  it('replaces an invalid caller-supplied correlation id', () => {
    http.get(DOMAIN_URL, { headers: { [CORRELATION_ID_HEADER]: 'not-a-guid' } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toMatch(UUID_PATTERN);
    request.flush([]);
  });

  it('adds a new GUID to system requests', () => {
    http.get(SYSTEM_URL).subscribe();

    const request = httpMock.expectOne(SYSTEM_URL);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toMatch(UUID_PATTERN);
    request.flush({});
  });

  it('does not add the header to non-target-API requests', () => {
    http.get(NON_TARGET_URL).subscribe();

    const request = httpMock.expectOne(NON_TARGET_URL);
    expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(false);
    request.flush({});
  });
});
