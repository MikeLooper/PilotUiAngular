import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth-interceptor';

const DOMAIN_URL = '/api/11201/v1/categories';
const SYSTEM_URL = '/api/11201/about';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  for (const url of [DOMAIN_URL, SYSTEM_URL]) {
    it(`adds X-Requested-With (${url})`, () => {
      http.get(url).subscribe();

      const request = httpMock.expectOne(url);
      expect(request.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
      request.flush({});
    });
  }
});
