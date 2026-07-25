export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'http'
  | 'validation'
  | 'unexpected';

export interface ApiError {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly message: string;
  readonly details?: unknown;
}

export class ApiClientError extends Error {
  public constructor(public readonly apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiClientError';
  }
}
