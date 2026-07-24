import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

import { errorHandlingInterceptor } from './error-handling-interceptor';
import { ApiErrorMapper } from '../errors/api-error.mapper';

describe('errorHandlingInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => errorHandlingInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiErrorMapper] });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
