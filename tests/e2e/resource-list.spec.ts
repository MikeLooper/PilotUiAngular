import { expect, test } from '../support/fixtures';
import { ResourcePage } from '../support/resource-page';

const twentyCategories = Array.from({ length: 20 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    categoryId: index + 1,
    categoryName: `Category ${number}`,
    description: `Item ${number}`,
  };
});

test.describe('Resource list', () => {
  test.beforeEach(({ mockApi }) => {
    mockApi.seed('categories', twentyCategories);
  });

  test('pages through the records', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');

    await expect(resourcePage.pagination).toHaveText(/Page 1 of 3 · 20 total records/);
    await expect(resourcePage.listItems).toHaveCount(8);
    await expect(resourcePage.titles.first()).toHaveText('Category 01');
    await expect(resourcePage.button('Previous')).toBeDisabled();

    await resourcePage.button('Next').click();
    await expect(resourcePage.pagination).toHaveText(/Page 2 of 3/);
    await expect(resourcePage.titles.first()).toHaveText('Category 09');

    await resourcePage.button('Next').click();
    await expect(resourcePage.pagination).toHaveText(/Page 3 of 3/);
    await expect(resourcePage.listItems).toHaveCount(4);
    await expect(resourcePage.button('Next')).toBeDisabled();

    await resourcePage.button('Previous').click();
    await expect(resourcePage.pagination).toHaveText(/Page 2 of 3/);
  });

  test('search filters the records and returns to the first page', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.button('Next').click();
    await expect(resourcePage.pagination).toHaveText(/Page 2 of 3/);

    await resourcePage.search.fill('category 1');

    await expect(resourcePage.pagination).toHaveText(/Page 1 of 2 · 10 total records/);
    await expect(resourcePage.titles.first()).toHaveText('Category 10');
  });

  test('search matches fields that are not displayed', async ({ page, mockApi }) => {
    mockApi.seed('categories', [
      { categoryId: 1, categoryName: 'Plain', description: 'Plain', picture: 'hidden-marker' },
      { categoryId: 2, categoryName: 'Other', description: 'Other' },
    ]);
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(2);

    await resourcePage.search.fill('HIDDEN-MARKER');

    await expect(resourcePage.titles).toHaveText(['Plain']);
  });

  test('search with no matches shows the empty state until cleared', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(8);

    await resourcePage.search.fill('zzz-no-match');

    await expect(page.getByText('No records matched your current filters.')).toBeVisible();
    await expect(resourcePage.listItems).toHaveCount(0);

    await resourcePage.search.clear();

    await expect(resourcePage.listItems).toHaveCount(8);
  });

  test('Toggle Sort reverses the order and returns to the first page', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.button('Next').click();
    await expect(resourcePage.pagination).toHaveText(/Page 2 of 3/);

    await resourcePage.button('Toggle Sort').click();

    await expect(resourcePage.pagination).toHaveText(/Page 1 of 3/);
    await expect(resourcePage.titles.first()).toHaveText('Category 20');

    await resourcePage.button('Toggle Sort').click();
    await expect(resourcePage.titles.first()).toHaveText('Category 01');
  });

  test('an empty collection (204) shows the empty state', async ({ page, mockApi }) => {
    mockApi.seed('categories', []);
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');

    await expect(page.getByText('No records matched your current filters.')).toBeVisible();
    await expect(resourcePage.pagination).toBeHidden();
  });

  test('selecting Load All again reloads from the API', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(8);

    mockApi.seed('categories', twentyCategories.slice(0, 3));
    await resourcePage.selectOperation('Load All');

    await expect(resourcePage.listItems).toHaveCount(3);
    expect(mockApi.requestsTo('GET', '/v1/categories/get-all')).toHaveLength(2);
  });

  test('returning to a resource uses the cached list and resets the controls', async ({
    page,
    mockApi,
  }) => {
    const resourcePage = new ResourcePage(page);
    const nav = page.getByRole('navigation', { name: 'Resource pages' });
    await resourcePage.goto('categories');
    await expect(resourcePage.listItems).toHaveCount(8);
    await resourcePage.search.fill('category 1');
    await expect(resourcePage.pagination).toContainText('10 total records');

    await nav.getByRole('link', { name: 'Shippers' }).click();
    await expect(page.getByRole('heading', { name: 'Shippers API' })).toBeVisible();
    await nav.getByRole('link', { name: 'Categories' }).click();

    await expect(resourcePage.search).toHaveValue('');
    await expect(resourcePage.pagination).toContainText('20 total records');
    expect(mockApi.requestsTo('GET', '/v1/categories/get-all')).toHaveLength(1);
  });
});
