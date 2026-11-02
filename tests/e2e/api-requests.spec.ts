import { expect, test } from '../support/fixtures';
import { MOCK_SECRETS, MOCK_TOKEN } from '../support/mock-api';
import { ResourcePage } from '../support/resource-page';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CALLER_NAME = 'PilotUiAngular';

test.describe('API request handling', () => {
  test('domain requests carry a bearer token, correlation ID, and caller name', async ({
    page,
    mockApi,
  }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(2);

    const headers = mockApi.requestsTo('GET', '/v1/categories/get-all')[0]?.headers;

    expect(headers?.['authorization']).toBe(`Bearer ${MOCK_TOKEN}`);
    expect(headers?.['x-correlation-id']).toMatch(UUID);
    expect(headers?.['x-caller-name']).toBe(CALLER_NAME);
    expect(headers?.['x-requested-with']).toBe('XMLHttpRequest');
  });

  test('each domain request gets its own correlation ID', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Get');
    await resourcePage.button('Get By Id').click();
    await expect(resourcePage.resultStatus).toHaveText('Succeeded');

    const list = mockApi.requestsTo('GET', '/v1/categories/get-all')[0];
    const item = mockApi.requestsTo('GET', '/v1/categories/get/1')[0];

    expect(item?.headers['x-correlation-id']).toMatch(UUID);
    expect(item?.headers['x-correlation-id']).not.toBe(list?.headers['x-correlation-id']);
  });

  test('system requests carry a correlation ID and caller name but no token', async ({
    page,
    mockApi,
  }) => {
    await page.goto('/');
    await expect(page.getByText('Connection to API: OK')).toBeVisible();

    for (const path of ['/healthcheck', '/about']) {
      const headers = mockApi.requestsTo('GET', path)[0]?.headers;

      expect(headers).toBeDefined();
      expect(headers?.['authorization']).toBeUndefined();
      expect(headers?.['x-correlation-id']).toMatch(UUID);
      expect(headers?.['x-caller-name']).toBe(CALLER_NAME);
    }
    expect(mockApi.tokenRequests).toHaveLength(0);
  });

  test('each API call is logged at its start and end with its identifiers', async ({
    page,
    mockApi,
  }) => {
    const entries: { message: string; details: Record<string, unknown> }[] = [];
    page.on('console', async (message) => {
      const [text, details] = await Promise.all(message.args().map((arg) => arg.jsonValue()));
      if (typeof text === 'string' && text.startsWith('API call ')) {
        entries.push({ message: text, details: details as Record<string, unknown> });
      }
    });
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(2);

    const sent = mockApi.requestsTo('GET', '/v1/categories/get-all')[0]?.headers;
    const logged = (): typeof entries =>
      entries.filter((entry) => entry.message.includes('/v1/categories/get-all'));
    await expect.poll(() => logged().length).toBeGreaterThanOrEqual(2);

    const [started, completed] = logged();
    expect(started?.message).toMatch(/^API call started: GET /);
    expect(completed?.message).toMatch(/^API call completed: GET /);
    for (const entry of [started, completed]) {
      expect(entry?.details).toMatchObject({
        correlationId: sent?.['x-correlation-id'],
        callerName: CALLER_NAME,
        requestId: expect.stringMatching(UUID),
      });
    }
    expect(completed?.details['requestId']).toBe(started?.details['requestId']);
    expect(completed?.details).toMatchObject({ status: 200, durationMs: expect.any(Number) });
  });

  test('the token is requested with the runtime secrets and reused', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(2);
    await page
      .getByRole('navigation', { name: 'Resource pages' })
      .getByRole('link', { name: 'Shippers' })
      .click();
    await expect(page.getByRole('heading', { name: 'Shippers API' })).toBeVisible();
    await expect(resourcePage.titles.first()).toHaveText('Speedy Express');

    expect(mockApi.tokenRequests).toHaveLength(1);
    const form = new URLSearchParams(mockApi.tokenRequests[0]?.body);
    expect(Object.fromEntries(form)).toEqual({
      grant_type: 'password',
      client_id: 'local-client',
      ...MOCK_SECRETS,
    });
  });

  test('when the IDP rejects the login, the API 401 is explained', async ({ page, mockApi }) => {
    mockApi.failTokenRequests(401);
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');

    await expect(resourcePage.listError).toContainText('You are not signed in');
    const request = mockApi.requestsTo('GET', '/v1/categories/get-all')[0];
    expect(request?.headers['authorization']).toBeUndefined();
  });
});
