import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LoadingService } from '../services/loading';
import { loadingInterceptor } from './loading-interceptor';

const URL = '/api/11001/v1/categories/get-all';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: Pick<LoadingService, 'requestStarted' | 'requestFinished'>;

  beforeEach(() => {
    loadingService = { requestStarted: vi.fn(), requestFinished: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        { provide: LoadingService, useValue: loadingService },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('marks a request as started when it is sent', () => {
    http.get(URL).subscribe();

    const request = httpMock.expectOne(URL);

    expect(loadingService.requestStarted).toHaveBeenCalledTimes(1);
    expect(loadingService.requestFinished).not.toHaveBeenCalled();
    request.flush([]);
  });

  it('marks the request as finished when it succeeds', () => {
    http.get(URL).subscribe();

    httpMock.expectOne(URL).flush([]);

    expect(loadingService.requestFinished).toHaveBeenCalledTimes(1);
  });

  it('marks the request as finished when it fails', () => {
    http.get(URL).subscribe({ error: () => undefined });

    httpMock.expectOne(URL).flush(null, { status: 500, statusText: 'Server Error' });

    expect(loadingService.requestFinished).toHaveBeenCalledTimes(1);
  });

  it('marks the request as finished when the caller unsubscribes early', () => {
    const subscription = http.get(URL).subscribe();
    const request = httpMock.expectOne(URL);

    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
    expect(loadingService.requestFinished).toHaveBeenCalledTimes(1);
  });
});
