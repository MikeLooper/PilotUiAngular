import { expect, test } from '../support/fixtures';
import { RESOURCES } from '../support/resources';

test.describe('Navigation', () => {
  test('the header shows the app title and marks the active link', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });

    await expect(page.getByRole('heading', { level: 1, name: 'Pilot UI' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveClass(/is-active/);

    await nav.getByRole('link', { name: 'API Explorer' }).click();

    await expect(page).toHaveURL('/explorer');
    await expect(nav.getByRole('link', { name: 'API Explorer' })).toHaveClass(/is-active/);
    await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveClass(/is-active/);
  });

  test('the table of contents links to each feature', async ({ page }) => {
    await page.goto('/');
    const toc = page.getByRole('region', { name: 'Table of Contents' });

    await toc.getByRole('link', { name: 'API Explorer' }).click();
    await expect(page.getByRole('heading', { name: 'API Explorer', level: 2 })).toBeVisible();

    await page.goBack();
    await toc.getByRole('link', { name: 'Resources' }).click();
    await expect(page).toHaveURL('/resources/categories');
  });

  test('/resources redirects to categories', async ({ page }) => {
    await page.goto('/resources');

    await expect(page).toHaveURL('/resources/categories');
    await expect(page.getByRole('heading', { name: 'Categories API' })).toBeVisible();
  });

  test('unknown routes redirect home', async ({ page }) => {
    await page.goto('/no/such/page');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Table of Contents' })).toBeVisible();
  });

  test('the resource nav opens every resource page', async ({ page }) => {
    await page.goto('/resources');
    const nav = page.getByRole('navigation', { name: 'Resource pages' });

    for (const resource of RESOURCES) {
      const link = nav.getByRole('link', { name: resource.navLabel, exact: true });
      await link.click();

      await expect(page).toHaveURL(`/resources/${resource.key}`);
      await expect(page.getByRole('heading', { name: resource.heading })).toBeVisible();
      await expect(link).toHaveClass(/is-active/);
    }

    await nav.getByRole('link', { name: 'System', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'System API' })).toBeVisible();
  });

  test('browser back returns to the previous resource', async ({ page }) => {
    await page.goto('/resources/shippers');
    await page
      .getByRole('navigation', { name: 'Resource pages' })
      .getByRole('link', { name: 'Suppliers' })
      .click();
    await expect(page.getByRole('heading', { name: 'Suppliers API' })).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL('/resources/shippers');
    await expect(page.getByRole('heading', { name: 'Shippers API' })).toBeVisible();
  });
});
