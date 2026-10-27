import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom } from 'rxjs';

import { ApiClientError } from '../errors/api-error.model';
import { errorHandlingInterceptor } from './error-handling-interceptor';

const URL = '/api/11001/v1/categories/get-all';

describe('errorHandlingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorHandlingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('passes successful responses through unchanged', async () => {
    const result = lastValueFrom(http.get<string[]>(URL));

    httpMock.expectOne(URL).flush(['Beverages']);

    expect(await result).toEqual(['Beverages']);
  });

  it('rethrows HTTP failures as an ApiClientError produced by ApiErrorMapper', async () => {
    const result = lastValueFrom(http.get(URL));

    httpMock.expectOne(URL).flush(
      { title: 'Database down' },
      {
        status: 500,
        statusText: 'Server Error',
      },
    );

    const error = await result.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).apiError).toMatchObject({
      kind: 'http',
      status: 500,
      message: 'Database down',
    });
  });

  it('maps network failures to a network ApiClientError', async () => {
    const result = lastValueFrom(http.get(URL));

    httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });

    await expect(result).rejects.toMatchObject({ apiError: { kind: 'network', status: 0 } });
  });
});
