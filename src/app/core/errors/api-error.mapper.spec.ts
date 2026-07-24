import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiErrorMapper } from './api-error.mapper';

describe('ApiErrorMapper', () => {
  let mapper: ApiErrorMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiErrorMapper] });
    mapper = TestBed.inject(ApiErrorMapper);
  });

  it('maps network failures correctly', () => {
    const error = new HttpErrorResponse({ status: 0 });
    const mapped = mapper.toApiError(error);

    expect(mapped.kind).toBe('network');
  });

  it('maps validation failures correctly', () => {
    const error = new HttpErrorResponse({ status: 400, error: { detail: 'invalid' } });
    const mapped = mapper.toApiError(error);

    expect(mapped.kind).toBe('validation');
  });
});
