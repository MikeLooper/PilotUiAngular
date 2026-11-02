import { defineConfig, devices } from '@playwright/test';

const port = 4201;
const isCi = !!process.env['CI'];

export default defineConfig({
  outputDir: './test-results',
  fullyParallel: true,
  // The Angular dev server stalls page loads past the test timeout with 8 workers.
  workers: 2,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Runs against a stateful in-browser mock of the API; no backend or IDP is needed.
    { name: 'mocked', testDir: './e2e', use: { ...devices['Desktop Chrome'] } },
    // Read-only checks against the real backend through the dev-server proxy. Select it with
    // the test:e2e:live script, since it needs the backend and IDP running.
    { name: 'live', testDir: './live', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm start -- --port ${port}`,
    cwd: '..',
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCi,
    timeout: 180_000,
  },
});
