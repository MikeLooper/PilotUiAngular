import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth-interceptor';

const DOMAIN_URL = '/api/11201/v1/categories/get-all';
const SYSTEM_URL = '/api/11201/about';
const NON_TARGET_URL = '/security-token-secrets.json';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it.each([DOMAIN_URL, SYSTEM_URL, NON_TARGET_URL])(
    'adds the X-Requested-With header to %s',
    (url) => {
      http.get(url).subscribe();

      const request = httpMock.expectOne(url);
      request.flush({});

      expect(request.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    },
  );

  it('keeps headers supplied by the caller', () => {
    http.get(DOMAIN_URL, { headers: { Accept: 'application/json' } }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);
    request.flush({});

    expect(request.request.headers.get('Accept')).toBe('application/json');
  });
});
