import { expect, test } from '../support/fixtures';
import { MOCK_SECRETS, MOCK_TOKEN } from '../support/mock-api';
import { ResourcePage } from '../support/resource-page';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.describe('API request handling', () => {
  test('domain requests carry a bearer token and correlation ID', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(2);

    const headers = mockApi.requestsTo('GET', '/v1/categories/get-all')[0]?.headers;

    expect(headers?.['authorization']).toBe(`Bearer ${MOCK_TOKEN}`);
    expect(headers?.['x-correlation-id']).toMatch(UUID);
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

  test('system requests carry neither a token nor a correlation ID', async ({ page, mockApi }) => {
    await page.goto('/');
    await expect(page.getByText('Connection to API: OK')).toBeVisible();

    for (const path of ['/healthcheck', '/about']) {
      const headers = mockApi.requestsTo('GET', path)[0]?.headers;

      expect(headers).toBeDefined();
      expect(headers?.['authorization']).toBeUndefined();
      expect(headers?.['x-correlation-id']).toBeUndefined();
    }
    expect(mockApi.tokenRequests).toHaveLength(0);
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
