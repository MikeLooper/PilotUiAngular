import { expect, test } from '../support/fixtures';
import { ResourcePage } from '../support/resource-page';

test.describe('System page', () => {
  test('Run Healthcheck shows the result', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('system');

    await resourcePage.button('Run Healthcheck').click();

    const panel = page.locator('.details-panel').filter({ hasText: 'Latest healthcheck result' });
    await expect(panel).toContainText('OK');
  });

  test('Load About shows the response', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('system');

    await resourcePage.button('Load About').click();

    const panel = page.locator('.details-panel').filter({ hasText: 'About response' });
    await expect(panel).toContainText('"name": "Mock Pilot API"');
    await expect(panel).toContainText('"buildVersion": "42"');
  });

  test('a failed healthcheck shows an error that clears on success', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('system');
    mockApi.failNext('GET', '/healthcheck', { status: 503 });

    await resourcePage.button('Run Healthcheck').click();

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Health check failed');
    await expect(alert).toContainText('The API service is unavailable');

    await resourcePage.button('Run Healthcheck').click();

    await expect(alert).toBeHidden();
    await expect(page.getByText('Latest healthcheck result')).toBeVisible();
  });

  test('does not show CRUD controls', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('system');
    await expect(resourcePage.button('Run Healthcheck')).toBeVisible();

    await expect(resourcePage.search).toBeHidden();
    await expect(page.getByRole('radio')).toHaveCount(0);
  });
});
