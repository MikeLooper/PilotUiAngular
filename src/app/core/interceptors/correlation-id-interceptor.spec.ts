import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment.development';
import { APP_ENV } from '../config/app-config';
import { CORRELATION_ID_HEADER, correlationIdInterceptor } from './correlation-id-interceptor';

const DOMAIN_URL = '/api/11201/v1/categories/get-all';
const SYSTEM_URL = '/api/11201/about';
const NON_TARGET_URL = '/idp/realms/local-realm/protocol/openid-connect/token';
const FIRST_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_ID = '22222222-2222-4222-8222-222222222222';
const CALLER_ID = '7ea2c7f7-8b46-475d-86f8-7aaaa9e4a35b';

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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([DOMAIN_URL, SYSTEM_URL])('adds a new GUID to target API request %s', (url) => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FIRST_ID);

    http.get(url).subscribe();

    const request = httpMock.expectOne(url);
    request.flush({});
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(FIRST_ID);
  });

  it('generates a separate GUID for each request', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(FIRST_ID).mockReturnValueOnce(SECOND_ID);

    http.get(DOMAIN_URL).subscribe();
    http.get(DOMAIN_URL).subscribe();

    const requests = httpMock.match(DOMAIN_URL);
    requests.forEach((request) => request.flush([]));
    expect(requests.map((request) => request.request.headers.get(CORRELATION_ID_HEADER))).toEqual([
      FIRST_ID,
      SECOND_ID,
    ]);
  });

  it('keeps a valid caller-supplied correlation id', () => {
    const randomUuid = vi.spyOn(crypto, 'randomUUID');

    http.get(DOMAIN_URL, { headers: { [CORRELATION_ID_HEADER]: CALLER_ID } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush([]);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(CALLER_ID);
    expect(randomUuid).not.toHaveBeenCalled();
  });

  it.each(['not-a-guid', ''])('replaces the invalid caller-supplied id "%s"', (callerId) => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FIRST_ID);

    http.get(DOMAIN_URL, { headers: { [CORRELATION_ID_HEADER]: callerId } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush([]);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(FIRST_ID);
  });

  it('does not add the header to non-target-API requests', () => {
    http.get(NON_TARGET_URL).subscribe();

    const request = httpMock.expectOne(NON_TARGET_URL);
    request.flush({});
    expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(false);
  });

  it('builds a v4 GUID from random bytes when crypto.randomUUID is unavailable', () => {
    const getRandomValues = vi.fn(<T extends ArrayBufferView | null>(array: T): T => {
      (array as unknown as Uint8Array).fill(0xff);
      return array;
    });
    vi.stubGlobal('crypto', { getRandomValues });

    http.get(DOMAIN_URL).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush([]);
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(
      'ffffffff-ffff-4fff-bfff-ffffffffffff',
    );
  });
});
