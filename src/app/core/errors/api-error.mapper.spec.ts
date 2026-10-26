import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ApiErrorMapper } from './api-error.mapper';
import { ApiClientError } from './api-error.model';

describe('ApiErrorMapper', () => {
  let mapper: ApiErrorMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(ApiErrorMapper);
  });

  it('creates the mapper', () => {
    expect(mapper).toBeTruthy();
  });

  describe('toClientError', () => {
    it('wraps the mapped API error in an ApiClientError', () => {
      const error = new HttpErrorResponse({ status: 400, error: { detail: 'invalid' } });

      const clientError = mapper.toClientError(error);

      expect(clientError).toBeInstanceOf(ApiClientError);
      expect(clientError.apiError).toEqual(mapper.toApiError(error));
      expect(clientError.message).toBe('Some input values are invalid. Review and try again.');
    });
  });

  describe('toApiError', () => {
    it.each([
      { label: 'a plain Error', error: new Error('boom') },
      { label: 'a string', error: 'boom' },
      { label: 'null', error: null },
      { label: 'undefined', error: undefined },
    ])('maps $label to an unexpected error carrying the original value', ({ error }) => {
      const mapped = mapper.toApiError(error);

      expect(mapped).toEqual({
        kind: 'unexpected',
        status: null,
        message: 'An unexpected error occurred. Please try again.',
        details: error,
      });
    });

    it('maps status 0 to a network error', () => {
      const error = new HttpErrorResponse({ status: 0, error: 'offline' });

      const mapped = mapper.toApiError(error);

      expect(mapped).toEqual({
        kind: 'network',
        status: 0,
        message: 'The API is unreachable. Check your network connection.',
        details: 'offline',
      });
    });

    it('maps status 408 to a timeout error', () => {
      const error = new HttpErrorResponse({ status: 408 });

      const mapped = mapper.toApiError(error);

      expect(mapped).toMatchObject({
        kind: 'timeout',
        status: 408,
        message: 'The request timed out. Please retry.',
      });
    });

    it('maps status 400 to a validation error with the payload as details', () => {
      const payload = { detail: 'invalid' };
      const error = new HttpErrorResponse({ status: 400, error: payload });

      const mapped = mapper.toApiError(error);

      expect(mapped).toEqual({
        kind: 'validation',
        status: 400,
        message: 'Some input values are invalid. Review and try again.',
        details: payload,
      });
    });

    it.each([502, 503, 504])(
      'maps status %i to a backend-unavailable http error, ignoring any server message',
      (status) => {
        const error = new HttpErrorResponse({ status, error: { title: 'Gateway says no' } });

        const mapped = mapper.toApiError(error);

        expect(mapped).toMatchObject({
          kind: 'http',
          status,
          message: 'The API service is unavailable. Ensure the backend is running and try again.',
        });
      },
    );

    it.each([
      { label: 'a non-empty string payload', payload: 'Plain failure', expected: 'Plain failure' },
      { label: 'payload.message', payload: { message: 'From message' }, expected: 'From message' },
      { label: 'payload.detail', payload: { detail: 'From detail' }, expected: 'From detail' },
      { label: 'payload.title', payload: { title: 'From title' }, expected: 'From title' },
      { label: 'payload.error', payload: { error: 'From error' }, expected: 'From error' },
    ])('uses $label as the message for other http errors', ({ payload, expected }) => {
      const error = new HttpErrorResponse({ status: 500, error: payload });

      const mapped = mapper.toApiError(error);

      expect(mapped).toEqual({ kind: 'http', status: 500, message: expected, details: payload });
    });

    it('prefers message over detail, title, and error when several are present', () => {
      const payload = { error: 'e', title: 't', detail: 'd', message: 'm' };
      const error = new HttpErrorResponse({ status: 500, error: payload });

      const mapped = mapper.toApiError(error);

      expect(mapped.message).toBe('m');
    });

    it('skips blank and non-string candidates when choosing the server message', () => {
      const payload = { message: '   ', detail: 42, title: 'Usable title' };
      const error = new HttpErrorResponse({ status: 500, error: payload });

      const mapped = mapper.toApiError(error);

      expect(mapped.message).toBe('Usable title');
    });

    it.each([
      { label: 'a blank string payload', payload: '  ' },
      { label: 'a null payload', payload: null },
      { label: 'a numeric payload', payload: 42 },
      { label: 'an object without usable fields', payload: { message: '', code: 7 } },
    ])('falls back to a generic message for $label', ({ payload }) => {
      const error = new HttpErrorResponse({ status: 500, error: payload });

      const mapped = mapper.toApiError(error);

      expect(mapped).toMatchObject({
        kind: 'http',
        status: 500,
        message: 'The server failed to process the request.',
      });
    });
  });
});
