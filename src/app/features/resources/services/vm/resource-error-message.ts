import { ApiClientError, ApiError } from '../../../../core/errors/api-error.model';
import { ResourceOperation } from './resource-vm.models';

const statusMessages: Readonly<Record<number, string>> = {
  401: 'You are not signed in, or your session has expired. Sign in and try again.',
  403: 'You do not have permission to perform this action.',
  405: 'This action is not supported for this resource.',
  408: 'The request timed out. Please try again.',
  409: 'The request conflicts with existing data, such as a duplicate ID or a record that is still in use by other records.',
  410: 'The record no longer exists.',
  412: 'The record was changed by someone else. Reload it and try again.',
  413: 'The request is too large. Shorten the values and try again.',
  415: 'The request body was not in a format the API accepts.',
  422: 'Some input values could not be processed. Review them and try again.',
  429: 'Too many requests were sent. Wait a moment and try again.',
  500: 'The server ran into a problem while processing the request. Please try again later.',
  501: 'This action is not available on the server.',
  502: 'The API service is unavailable. Ensure the backend is running and try again.',
  503: 'The API service is unavailable. Ensure the backend is running and try again.',
  504: 'The API service took too long to respond. Please try again later.',
};

const recordOperations: readonly ResourceOperation[] = ['get', 'update', 'delete'];

/**
 * Translates a failed resource request into a message for the user. API errors with a status of
 * 300 or greater are described by status rather than with the server's (often technical) text;
 * validation failures list the field errors the API reported.
 */
export function toResourceErrorMessage(error: unknown, operation?: ResourceOperation): string {
  if (error instanceof ApiClientError) {
    return describeApiError(error.apiError, operation);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' && message ? message : 'Request failed.';
  }

  return 'Request failed.';
}

function describeApiError(apiError: ApiError, operation?: ResourceOperation): string {
  const status = apiError.status;

  if (status === null || status < 300) {
    return apiError.message;
  }

  if (status < 400) {
    return 'The API redirected the request somewhere this page cannot follow. Please try again later.';
  }

  if (status === 400) {
    return describeValidationError(apiError.details);
  }

  if (status === 404) {
    return operation && recordOperations.includes(operation)
      ? 'No record was found with that ID. Check the ID and try again.'
      : 'The requested data could not be found.';
  }

  const known = statusMessages[status];
  if (known) {
    return known;
  }

  return status < 500
    ? 'The request could not be completed. Review the values and try again.'
    : 'The server ran into a problem while processing the request. Please try again later.';
}

function describeValidationError(details: unknown): string {
  const base = 'Some input values are invalid.';
  const fieldErrors = extractFieldErrors(details);

  return fieldErrors.length > 0
    ? `${base} ${fieldErrors.join(' ')}`
    : `${base} Review them and try again.`;
}

/** Reads the `errors` map of an RFC 7807 validation problem ({ field: [messages] }). */
function extractFieldErrors(details: unknown): readonly string[] {
  if (!details || typeof details !== 'object' || !('errors' in details)) {
    return [];
  }

  const errors = (details as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  return Object.values(errors as Record<string, unknown>)
    .flatMap((messages) => (Array.isArray(messages) ? messages : [messages]))
    .filter((message): message is string => typeof message === 'string' && message.trim() !== '')
    .map((message) => message.trim());
}
