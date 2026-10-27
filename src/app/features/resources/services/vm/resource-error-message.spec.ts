import { ApiClientError, ApiError } from '../../../../core/errors/api-error.model';
import { toResourceErrorMessage } from './resource-error-message';

const SERVER_TEXT = 'System.NullReferenceException at Repository.Get()';

function apiError(status: number | null, details?: unknown): ApiClientError {
  const error: ApiError = { kind: 'http', status, message: SERVER_TEXT, details };
  return new ApiClientError(error);
}

describe('toResourceErrorMessage', () => {
  it.each([
    { label: 'a network failure (status 0)', status: 0 },
    { label: 'an unexpected failure without a status', status: null },
    { label: 'a status below 300', status: 200 },
  ])('keeps the mapped message for $label', ({ status }) => {
    const error = apiError(status);

    const message = toResourceErrorMessage(error);

    expect(message).toBe(SERVER_TEXT);
  });

  it.each([300, 302, 399])('describes status %i as an unfollowable redirect', (status) => {
    const message = toResourceErrorMessage(apiError(status));

    expect(message).toBe(
      'The API redirected the request somewhere this page cannot follow. Please try again later.',
    );
  });

  it('asks the user to review the values for a 400 without field errors', () => {
    const message = toResourceErrorMessage(apiError(400, { title: 'Bad Request' }));

    expect(message).toBe('Some input values are invalid. Review them and try again.');
  });

  it('lists the field errors of a 400 validation problem', () => {
    const details = {
      errors: {
        CategoryName: ['The CategoryName field is required.', ' '],
        Description: ' Too long. ',
        Picture: [42],
      },
    };

    const message = toResourceErrorMessage(apiError(400, details));

    expect(message).toBe(
      'Some input values are invalid. The CategoryName field is required. Too long.',
    );
  });

  it.each([
    { label: 'a null errors map', details: { errors: null } },
    { label: 'a string payload', details: 'invalid' },
    { label: 'no payload', details: undefined },
  ])('falls back to the generic 400 message for $label', ({ details }) => {
    const message = toResourceErrorMessage(apiError(400, details));

    expect(message).toBe('Some input values are invalid. Review them and try again.');
  });

  it.each(['get', 'update', 'delete'] as const)(
    'reports a missing record for a 404 on %s',
    (operation) => {
      const message = toResourceErrorMessage(apiError(404), operation);

      expect(message).toBe('No record was found with that ID. Check the ID and try again.');
    },
  );

  it.each([
    { label: 'a create', operation: 'create' as const },
    { label: 'a list load', operation: undefined },
  ])('reports missing data for a 404 on $label', ({ operation }) => {
    const message = toResourceErrorMessage(apiError(404), operation);

    expect(message).toBe('The requested data could not be found.');
  });

  it.each([
    { status: 401, expected: 'You are not signed in' },
    { status: 403, expected: 'You do not have permission' },
    { status: 409, expected: 'conflicts with existing data' },
    { status: 429, expected: 'Too many requests' },
    { status: 500, expected: 'The server ran into a problem' },
    { status: 503, expected: 'The API service is unavailable' },
  ])('describes status $status without the server text', ({ status, expected }) => {
    const message = toResourceErrorMessage(apiError(status));

    expect(message).toContain(expected);
    expect(message).not.toContain(SERVER_TEXT);
  });

  it.each([
    {
      status: 418,
      expected: 'The request could not be completed. Review the values and try again.',
    },
    {
      status: 599,
      expected:
        'The server ran into a problem while processing the request. Please try again later.',
    },
  ])('uses a generic message for unlisted status $status', ({ status, expected }) => {
    const message = toResourceErrorMessage(apiError(status));

    expect(message).toBe(expected);
  });

  it.each([
    { label: 'an Error', error: new Error('Boom'), expected: 'Boom' },
    {
      label: 'an error with an empty message',
      error: { message: '' },
      expected: 'Request failed.',
    },
    { label: 'a non-object', error: 'boom', expected: 'Request failed.' },
    { label: 'null', error: null, expected: 'Request failed.' },
  ])('falls back to the message of $label', ({ error, expected }) => {
    const message = toResourceErrorMessage(error);

    expect(message).toBe(expected);
  });
});
