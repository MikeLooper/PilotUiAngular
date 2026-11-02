import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment.development';
import { APP_ENV } from '../config/app-config';
import {
  CALLER_NAME_HEADER,
  CALLER_NAME_MAX_LENGTH,
  callerNameInterceptor,
} from './caller-name-interceptor';

const DOMAIN_URL = '/api/11201/v1/categories/get-all';
const SYSTEM_URL = '/api/11201/about';
const HEALTHCHECK_URL = '/api/11201/healthcheck';
const NON_TARGET_URL = '/idp/realms/local-realm/protocol/openid-connect/token';
const CALLER_NAME = 'PilotUiAngularTests';

describe('callerNameInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function configure(callerName = CALLER_NAME): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([callerNameInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: { ...environment, callerName } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it.each([DOMAIN_URL, SYSTEM_URL, HEALTHCHECK_URL])(
    'adds the configured caller name to the target API request %s',
    (url) => {
      configure();

      http.get(url).subscribe();

      const request = httpMock.expectOne(url);
      request.flush({});
      expect(request.request.headers.get(CALLER_NAME_HEADER)).toBe(CALLER_NAME);
    },
  );

  it('keeps a caller-supplied caller name', () => {
    configure();

    http.get(DOMAIN_URL, { headers: { [CALLER_NAME_HEADER]: 'OtherCaller' } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush([]);
    expect(request.request.headers.get(CALLER_NAME_HEADER)).toBe('OtherCaller');
  });

  it.each(['', '   '])('replaces the blank caller-supplied name "%s"', (callerName) => {
    configure();

    http.get(DOMAIN_URL, { headers: { [CALLER_NAME_HEADER]: callerName } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush([]);
    expect(request.request.headers.get(CALLER_NAME_HEADER)).toBe(CALLER_NAME);
  });

  it('truncates the caller name to the maximum header length', () => {
    configure('x'.repeat(CALLER_NAME_MAX_LENGTH + 20));

    http.get(DOMAIN_URL).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush([]);
    expect(request.request.headers.get(CALLER_NAME_HEADER)).toBe(
      'x'.repeat(CALLER_NAME_MAX_LENGTH),
    );
  });

  it('does not add the header to a non-target request', () => {
    configure();

    http.get(NON_TARGET_URL).subscribe();

    const request = httpMock.expectOne(NON_TARGET_URL);
    request.flush({});
    expect(request.request.headers.has(CALLER_NAME_HEADER)).toBe(false);
  });
});
