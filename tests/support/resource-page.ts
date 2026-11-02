import { Locator, Page, expect } from '@playwright/test';

/** Page object for /resources/<key>; the page is the same component for every CRUD resource. */
export class ResourcePage {
  public readonly listItems: Locator;
  public readonly titles: Locator;
  public readonly pagination: Locator;
  public readonly payload: Locator;
  public readonly payloadError: Locator;
  public readonly result: Locator;
  public readonly resultStatus: Locator;
  public readonly resultRequest: Locator;
  public readonly resultResponse: Locator;
  public readonly search: Locator;
  public readonly listError: Locator;

  public constructor(public readonly page: Page) {
    this.listItems = page.locator('.resource-list > li');
    this.titles = this.listItems.locator('h3');
    this.pagination = page.locator('.pagination p');
    this.payload = page.getByLabel('Request body (JSON)');
    this.payloadError = page.locator('#payload-error');
    this.result = page.locator('.operation-result');
    this.resultStatus = page.locator('.operation-result__status');
    this.resultRequest = page.getByTestId('operation-request');
    this.resultResponse = page.getByTestId('operation-response');
    this.search = page.getByRole('searchbox', { name: 'Search' });
    this.listError = page.locator('.resource-card > .error');
  }

  public async goto(key: string): Promise<void> {
    await this.page.goto(`/resources/${key}`);
  }

  public button(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  public async selectOperation(
    name: 'Load All' | 'Get' | 'Create' | 'Update' | 'Delete',
  ): Promise<void> {
    await this.page.getByRole('radio', { name, exact: true }).click();
  }

  public async expectTotal(total: number): Promise<void> {
    await expect(this.pagination).toContainText(`${total} total records`);
  }
}
