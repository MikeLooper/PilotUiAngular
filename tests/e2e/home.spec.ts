import { expect, test } from '../support/fixtures';
import { DEFAULT_PORT } from '../support/mock-api';

test.describe('Home page', () => {
  test('shows the API status from the default data source', async ({ page, mockApi }) => {
    await page.goto('/');

    await expect(page.getByText('Connection to API: OK')).toBeVisible();
    await expect(page.getByText(`API Version: 1.0.${DEFAULT_PORT}`)).toBeVisible();
    await expect(page.getByText('API Deployed: 2026-01-15')).toBeVisible();
    await expect(page.getByText(`(/api/${DEFAULT_PORT})`)).toBeVisible();
    expect(mockApi.requestsTo('GET', '/healthcheck')[0]?.port).toBe(DEFAULT_PORT);
  });

  test('renders the logo', async ({ page }) => {
    await page.goto('/');

    const logo = page.getByRole('img', { name: 'Pilot API logo' });
    await expect(logo).toBeVisible();
    await expect
      .poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  });

  test('Refresh requests the status again', async ({ page, mockApi }) => {
    await page.goto('/');
    await expect(page.getByText('Connection to API: OK')).toBeVisible();

    await page.getByRole('button', { name: 'Refresh' }).click();

    await expect.poll(() => mockApi.requestsTo('GET', '/healthcheck').length).toBe(2);
    await expect(page.getByText('Connection to API: OK')).toBeVisible();
  });

  test('shows a failure and recovers with Try Again', async ({ page, mockApi }) => {
    mockApi.failNext('GET', '/healthcheck', { status: 503 });
    await page.goto('/');

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Request failed');
    await expect(alert).toContainText('The API service is unavailable');
    await expect(page.getByText('Connection to API: Unavailable')).toBeVisible();
    await expect(page.getByText('API Version: Unavailable')).toBeVisible();

    await alert.getByRole('button', { name: 'Try Again' }).click();

    await expect(alert).toBeHidden();
    await expect(page.getByText('Connection to API: OK')).toBeVisible();
  });

  test('reports an unreachable API', async ({ page, mockApi }) => {
    mockApi.failNext('GET', '/about', { abort: true });
    await page.goto('/');

    await expect(page.getByRole('alert')).toContainText('The API is unreachable');
  });

  test.describe('data source selection', () => {
    const sources = [
      { name: '.NET Core application with SQL Server', port: 11001 },
      { name: '.NET Core application with PostgreSQL', port: 11101 },
      { name: 'Java Spring Boot application with SQL Server', port: 11201 },
      { name: 'Java Spring Boot application with PostgreSQL', port: 11301 },
      { name: 'Python application with SQL Server', port: 11401 },
      { name: 'Python application with PostgreSQL', port: 11501 },
    ];

    test('lists every source with the first selected', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('radio')).toHaveCount(sources.length);
      await expect(page.getByRole('radio', { name: sources[0]!.name })).toBeChecked();
    });

    for (const source of sources.slice(1)) {
      test(`switching to "${source.name}" targets port ${source.port}`, async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Connection to API: OK')).toBeVisible();

        await page.getByRole('radio', { name: source.name }).check();

        await expect(page.getByText(`API Version: 1.0.${source.port}`)).toBeVisible();
        await expect(page.getByText(`(/api/${source.port})`)).toBeVisible();
      });
    }

    test('the selection applies to resource requests and survives navigation', async ({
      page,
      mockApi,
    }) => {
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Primary' });
      const source = page.getByRole('radio', { name: 'Python application with PostgreSQL' });
      await source.check();
      await expect(page.getByText('API Version: 1.0.11501')).toBeVisible();

      await nav.getByRole('link', { name: 'Resources' }).click();
      await expect(page.locator('.resource-list > li')).toHaveCount(2);

      const requests = mockApi.requestsTo('GET', '/v1/categories/get-all');
      expect(requests.map((request) => request.port)).toEqual([11501]);

      await nav.getByRole('link', { name: 'Home' }).click();
      await expect(source).toBeChecked();
    });
  });
});
