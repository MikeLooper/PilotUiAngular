import { test as base, expect } from '@playwright/test';
import { MockApi } from './mock-api';

interface Fixtures {
  readonly mockApi: MockApi;
}

/**
 * Every test gets a fresh mock API, and fails if the app raised an uncaught error or called an
 * endpoint the mock does not know about.
 */
export const test = base.extend<Fixtures>({
  mockApi: [
    async ({ page }, use) => {
      const mockApi = new MockApi();
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await mockApi.install(page);
      await use(mockApi);

      expect(pageErrors, 'uncaught page errors').toEqual([]);
      expect(mockApi.unhandled, 'requests the mock API does not handle').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
