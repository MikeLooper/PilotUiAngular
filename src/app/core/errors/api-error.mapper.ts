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

    if (error.status === 502 || error.status === 503 || error.status === 504) {
      return {
        kind: 'http',
        status: error.status,
        message: 'The API service is unavailable. Ensure the backend is running and try again.',
        details: error.error,
      };
    }

    const serverMessage = this.extractServerMessage(error.error);

    return {
      kind: 'http',
      status: error.status,
      message: serverMessage ?? 'The server failed to process the request.',
      details: error.error,
    };
  }

  private extractServerMessage(payload: unknown): string | null {
    if (typeof payload === 'string') {
      return payload.trim().length > 0 ? payload : null;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const candidate = payload as {
      message?: unknown;
      detail?: unknown;
      title?: unknown;
      error?: unknown;
    };

    const values = [candidate.message, candidate.detail, candidate.title, candidate.error];

    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }
}
