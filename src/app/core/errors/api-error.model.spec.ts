import { ApiClientError, ApiError } from './api-error.model';

const API_ERROR: ApiError = { kind: 'timeout', status: 408, message: 'The request timed out.' };

describe('ApiClientError', () => {
  describe('constructor', () => {
    it('uses the API error message as the Error message', () => {
      const error = new ApiClientError(API_ERROR);

      expect(error.message).toBe('The request timed out.');
    });

    it('names the error ApiClientError', () => {
      const error = new ApiClientError(API_ERROR);

      expect(error.name).toBe('ApiClientError');
    });

    it('is an Error instance', () => {
      const error = new ApiClientError(API_ERROR);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('apiError', () => {
    it('exposes the API error it was created with', () => {
      const error = new ApiClientError(API_ERROR);

      expect(error.apiError).toBe(API_ERROR);
    });
  });
});
