import { expect, test } from '../support/fixtures';
import { ResourcePage } from '../support/resource-page';

test.describe('Resource list errors', () => {
  const cases = [
    { status: 500, message: 'The server ran into a problem' },
    { status: 503, message: 'The API service is unavailable' },
    { status: 403, message: 'You do not have permission' },
  ];

  for (const { status, message } of cases) {
    test(`a ${status} shows a friendly message and Try Again recovers`, async ({
      page,
      mockApi,
    }) => {
      mockApi.failNext('GET', '/v1/categories/get-all', { status });
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto('categories');

      await expect(resourcePage.listError).toContainText('Request failed');
      await expect(resourcePage.listError).toContainText(message);

      await resourcePage.listError.getByRole('button', { name: 'Try Again' }).click();

      await expect(resourcePage.listError).toBeHidden();
      await expect(resourcePage.listItems).toHaveCount(2);
    });
  }
});

test.describe('Single-record errors', () => {
  test('Get with an unknown ID reports no record', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Get');
    await page.getByLabel('Category ID').fill('999');

    await resourcePage.button('Get By Id').click();

    await expect(resourcePage.resultStatus).toHaveText('Failed');
    await expect(resourcePage.result).toContainText('No record was found with that ID');
    await expect(resourcePage.resultResponse).toHaveText('(no content)');
  });

  test('a non-numeric ID surfaces the field errors from the API', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Get');
    await page.getByLabel('Category ID').fill('abc');

    await resourcePage.button('Get By Id').click();

    await expect(resourcePage.resultStatus).toHaveText('Failed');
    await expect(resourcePage.result).toContainText(
      'Some input values are invalid. The ID must be a number.',
    );
  });

  test('Delete with an unknown ID leaves the list untouched', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(2);
    await resourcePage.selectOperation('Delete');
    await page.getByLabel('Category ID').fill('999');

    await resourcePage.button('Delete').click();

    await expect(resourcePage.resultStatus).toHaveText('Failed');
    await resourcePage.selectOperation('Load All');
    await expect(resourcePage.listItems).toHaveCount(2);
    expect(mockApi.requestsTo('DELETE', '/v1/categories/delete/999')).toHaveLength(1);
  });

  test('Create with a duplicate ID reports the conflict', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('customers');
    await resourcePage.selectOperation('Create');
    await resourcePage.payload.fill(JSON.stringify({ customerId: 'ALFKI', companyName: 'Copy' }));

    await resourcePage.button('Create').click();

    await expect(resourcePage.resultStatus).toHaveText('Failed');
    await expect(resourcePage.result).toContainText('The request conflicts with existing data');
  });

  test('an unreachable API is reported beside the request', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Get');
    mockApi.failNext('GET', '/v1/categories/get/1', { abort: true });

    await resourcePage.button('Get By Id').click();

    await expect(resourcePage.resultStatus).toHaveText('Failed');
    await expect(resourcePage.result).toContainText('The API is unreachable');
  });
});

test.describe('Request body validation', () => {
  const invalidBodies = [
    { name: 'malformed JSON', body: '{ not json', message: 'The request body is not valid JSON' },
    { name: 'a JSON array', body: '[]', message: 'The request body must be a JSON object.' },
    { name: 'a JSON scalar', body: '42', message: 'The request body must be a JSON object.' },
  ];

  for (const { name, body, message } of invalidBodies) {
    test(`Create rejects ${name} without calling the API`, async ({ page, mockApi }) => {
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto('categories');
      await resourcePage.selectOperation('Create');
      await resourcePage.payload.fill(body);

      await resourcePage.button('Create').click();

      await expect(resourcePage.payloadError).toContainText(message);
      expect(mockApi.requestsTo('POST', '/v1/categories/add')).toHaveLength(0);
    });
  }

  test('Update rejects malformed JSON without calling the API', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Update');
    await resourcePage.payload.fill('{ not json');

    await resourcePage.button('Update').click();

    await expect(resourcePage.payloadError).toContainText('The request body is not valid JSON');
    expect(mockApi.requestsTo('PUT', '/v1/categories/update')).toHaveLength(0);
  });

  test('editing the body clears the error', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Create');
    await resourcePage.payload.fill('[]');
    await resourcePage.button('Create').click();
    await expect(resourcePage.payloadError).toBeVisible();

    await resourcePage.payload.fill('{}');

    await expect(resourcePage.payloadError).toBeHidden();
  });
});
