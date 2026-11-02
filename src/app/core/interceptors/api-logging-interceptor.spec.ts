import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { APP_ENV } from '../config/app-config';
import { LoggerService } from '../services/logger';
import { apiLoggingInterceptor } from './api-logging-interceptor';
import { CALLER_NAME_HEADER } from './caller-name-interceptor';
import { CORRELATION_ID_HEADER } from './correlation-id-interceptor';

const DOMAIN_URL = '/api/11201/v1/categories/get-all';
const SYSTEM_URL = '/api/11201/about';
const NON_TARGET_URL = '/idp/realms/local-realm/protocol/openid-connect/token';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const CORRELATION_ID = '7ea2c7f7-8b46-475d-86f8-7aaaa9e4a35b';
const CALLER_NAME = 'PilotUiAngular';
const HEADERS = { [CORRELATION_ID_HEADER]: CORRELATION_ID, [CALLER_NAME_HEADER]: CALLER_NAME };
const CONTEXT = {
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
  callerName: CALLER_NAME,
  method: 'GET',
  url: DOMAIN_URL,
};

describe('apiLoggingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let logger: Pick<LoggerService, 'info' | 'warn' | 'error'>;

  beforeEach(() => {
    logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(REQUEST_ID);
    vi.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValue(1042.4);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiLoggingInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
        { provide: LoggerService, useValue: logger },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('logs the start of a call with its request id, correlation id, and caller name', () => {
    http.get(DOMAIN_URL, { headers: HEADERS }).subscribe();

    const request = httpMock.expectOne(DOMAIN_URL);

    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      `API call started: GET ${DOMAIN_URL}`,
      CONTEXT,
    );
    request.flush([]);
  });

  it('logs the completion of a successful call with its status and duration', () => {
    http.get(DOMAIN_URL, { headers: HEADERS }).subscribe();

    httpMock.expectOne(DOMAIN_URL).flush([]);

    expect(logger.info).toHaveBeenLastCalledWith(`API call completed: GET ${DOMAIN_URL}`, {
      ...CONTEXT,
      status: 200,
      durationMs: 42,
    });
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a failed call as an error with its status and the error', () => {
    http.get(DOMAIN_URL, { headers: HEADERS }).subscribe({ error: () => undefined });

    httpMock.expectOne(DOMAIN_URL).flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(`API call failed: GET ${DOMAIN_URL}`, {
      ...CONTEXT,
      status: 503,
      durationMs: 42,
      error: expect.objectContaining({ status: 503 }),
    });
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a null status when the call fails without an HTTP response', () => {
    const failure = new Error('boom');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiLoggingInterceptor, () => throwError(() => failure)]),
        ),
        { provide: APP_ENV, useValue: environment },
        { provide: LoggerService, useValue: logger },
      ],
    });

    TestBed.inject(HttpClient)
      .get(DOMAIN_URL)
      .subscribe({ error: () => undefined });

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      `API call failed: GET ${DOMAIN_URL}`,
      expect.objectContaining({ status: null, error: failure }),
    );
  });

  it('logs a call that is unsubscribed before it ends as cancelled', () => {
    const subscription = http.get(DOMAIN_URL, { headers: HEADERS }).subscribe();
    const request = httpMock.expectOne(DOMAIN_URL);

    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(`API call cancelled: GET ${DOMAIN_URL}`, {
      ...CONTEXT,
      status: null,
      durationMs: 42,
    });
  });

  it('logs null ids and the query string when the identifying headers are absent', () => {
    const url = `${SYSTEM_URL}?show-details=true`;
    http.get(SYSTEM_URL, { params: { 'show-details': true } }).subscribe();

    httpMock.expectOne((candidate) => candidate.url === SYSTEM_URL).flush({});

    expect(logger.info).toHaveBeenCalledWith(`API call started: GET ${url}`, {
      requestId: REQUEST_ID,
      correlationId: null,
      callerName: null,
      method: 'GET',
      url,
    });
  });

  it('does not log a non-target request', () => {
    http.post(NON_TARGET_URL, {}).subscribe();

    httpMock.expectOne(NON_TARGET_URL).flush({});

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
