import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError, ApiClientError } from './api-error.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorMapper {
  public toClientError(error: unknown): ApiClientError {
    return new ApiClientError(this.toApiError(error));
  }

  public toApiError(error: unknown): ApiError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        kind: 'unexpected',
        status: null,
        message: 'An unexpected error occurred. Please try again.',
        details: error,
      };
    }

    if (error.status === 0) {
      return {
        kind: 'network',
        status: 0,
        message: 'The API is unreachable. Check your network connection.',
        details: error.error,
      };
    }

    if (error.status === 408) {
      return {
        kind: 'timeout',
        status: 408,
        message: 'The request timed out. Please retry.',
        details: error.error,
      };
    }

    if (error.status === 400) {
      return {
        kind: 'validation',
        status: 400,
        message: 'Some input values are invalid. Review and try again.',
        details: error.error,
      };
    }

    return {
      kind: 'http',
      status: error.status,
      message: 'The server failed to process the request.',
      details: error.error,
    };
  }
}
