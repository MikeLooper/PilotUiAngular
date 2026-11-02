import { expect, test } from '@playwright/test';

/**
 * Read-only smoke checks against the real default backend (port 11001) and IDP, through the
 * dev-server proxy, using public/security-token-secrets.json. Nothing here may change data.
 */
test.describe('Live backend', () => {
  // A real backend can take several seconds to answer its first request.
  const loaded = { timeout: 20_000 };

  test('the home page reports a connected API', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/API Version: (?!Loading|Unavailable)/)).toBeVisible(loaded);
    await expect(page.getByRole('alert')).toBeHidden();
  });

  for (const key of ['categories', 'shippers', 'order-details']) {
    test(`${key} loads through the authenticated API`, async ({ page }) => {
      await page.goto(`/resources/${key}`);

      await expect(page.locator('.resource-list > li').first()).toBeVisible(loaded);
      await expect(page.locator('.pagination p')).toContainText('total records');
      await expect(page.getByRole('alert')).toBeHidden();
    });
  }
});
