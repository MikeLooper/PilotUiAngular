import { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { RESOURCES } from '../support/resources';

function panel(page: Page, key: string) {
  return page.locator(`article.resource-panel#${key}`);
}

function panelButton(page: Page, key: string, name: string) {
  return panel(page, key).getByRole('button', { name, exact: true });
}

test.describe('API Explorer', () => {
  test('opens on Categories and loads its records', async ({ page, mockApi }) => {
    await page.goto('/explorer');

    await expect(page.getByRole('button', { name: 'Categories' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(panel(page, 'categories').locator('pre')).toContainText('Beverages');
    expect(mockApi.requestsTo('GET', '/v1/categories/get-all')).toHaveLength(1);
  });

  for (const resource of RESOURCES) {
    test(`the ${resource.navLabel} quick link loads that section`, async ({ page }) => {
      await page.goto('/explorer');
      const nav = page.getByRole('navigation', { name: 'API resource quick links' });

      await nav.getByRole('button', { name: resource.navLabel, exact: true }).click();

      await expect(page.locator('article.resource-panel')).toHaveCount(1);
      await expect(
        panel(page, resource.key).getByRole('heading', { name: resource.navLabel, exact: true }),
      ).toBeVisible();
      const firstId = String(resource.seed[0]![resource.idFields[0]!]);
      await expect(panel(page, resource.key).locator('pre')).toContainText(firstId);
    });
  }

  test('Get By ID shows the record for the entered ID', async ({ page, mockApi }) => {
    await page.goto('/explorer');
    const section = panel(page, 'categories');
    await expect(section.locator('pre')).toContainText('Beverages');
    await section.getByLabel('Category ID').first().fill('2');

    await panelButton(page, 'categories', 'Get By ID').click();

    await expect(section.locator('pre')).toContainText('Condiments');
    await expect(section.locator('pre')).not.toContainText('Beverages');
    expect(mockApi.requestsTo('GET', '/v1/categories/get/2')).toHaveLength(1);
  });

  test('Get By ID uses both IDs for order details', async ({ page, mockApi }) => {
    await page.goto('/explorer');
    await page.getByRole('button', { name: 'Order Details' }).click();
    const section = panel(page, 'order-details');
    await section.getByLabel('Product ID').first().fill('2');

    await panelButton(page, 'order-details', 'Get By ID').click();

    await expect(section.locator('pre')).toContainText('"unitPrice": 19');
    expect(mockApi.requestsTo('GET', '/v1/order-details/get/product/2/order/10248')).toHaveLength(
      1,
    );
  });

  test('Add posts the payload and shows the new ID', async ({ page, mockApi }) => {
    await page.goto('/explorer');
    const section = panel(page, 'categories');
    await section
      .getByLabel('Add payload (JSON)')
      .fill(JSON.stringify({ categoryName: 'From explorer' }));

    await panelButton(page, 'categories', 'Add').click();

    await expect(section.locator('pre')).toContainText('"id": 3');
    expect(mockApi.requestsTo('POST', '/v1/categories/add')[0]?.body).toEqual({
      categoryName: 'From explorer',
    });
  });

  test('Update puts the payload and reports success', async ({ page, mockApi }) => {
    await page.goto('/explorer');

    await panelButton(page, 'categories', 'Update').click();

    await expect(panel(page, 'categories').locator('pre')).toContainText('"success": true');
    expect(mockApi.requestsTo('PUT', '/v1/categories/update')[0]?.body).toMatchObject({
      categoryId: 1,
      categoryName: 'Updated name',
    });
  });

  test('Delete removes the record', async ({ page, mockApi }) => {
    await page.goto('/explorer');
    const section = panel(page, 'categories');

    await panelButton(page, 'categories', 'Delete').click();
    await expect(section.locator('pre')).toContainText('"success": true');
    expect(mockApi.requestsTo('DELETE', '/v1/categories/delete/1')).toHaveLength(1);

    await panelButton(page, 'categories', 'Load All').click();
    await expect(section.locator('pre')).toContainText('Condiments');
    await expect(section.locator('pre')).not.toContainText('Beverages');
  });

  test('invalid payload JSON is reported without calling the API', async ({ page, mockApi }) => {
    await page.goto('/explorer');
    await panel(page, 'categories').getByLabel('Add payload (JSON)').fill('{ not json');

    await panelButton(page, 'categories', 'Add').click();

    await expect(panel(page, 'categories').locator('.error')).toHaveText(
      'Invalid Categories payload JSON.',
    );
    expect(mockApi.requestsTo('POST', '/v1/categories/add')).toHaveLength(0);
  });

  test('API failures are shown in the section', async ({ page, mockApi }) => {
    mockApi.failNext('GET', '/v1/categories/get-all', { status: 503 });
    await page.goto('/explorer');
    const section = panel(page, 'categories');

    await expect(section.locator('.error')).toContainText('The API service is unavailable');

    await panelButton(page, 'categories', 'Load All').click();

    await expect(section.locator('.error')).toBeHidden();
    await expect(section.locator('pre')).toContainText('Beverages');
  });

  test('the header runs the system endpoints', async ({ page, mockApi }) => {
    await page.goto('/explorer');
    const header = page.locator('.explorer-page__header');

    await header.getByRole('button', { name: 'Run System Healthcheck' }).click();
    await expect(header.locator('pre')).toHaveText('"OK"');

    await header.getByRole('button', { name: 'Load About' }).click();
    await expect(header.locator('pre')).toContainText('"name": "Mock Pilot API"');

    mockApi.failNext('GET', '/healthcheck', { status: 503 });
    await header.getByRole('button', { name: 'Run System Healthcheck' }).click();
    await expect(header.locator('.error')).toContainText('The API service is unavailable');
  });
});
