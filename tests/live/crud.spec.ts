import { Page, Response, expect, test } from '@playwright/test';
import { ResourcePage } from '../support/resource-page';
import { RESOURCES, ResourceDefinition, ResourceRecord } from '../support/resources';

/**
 * Calls every endpoint of the default data source (port 11001) through the UI, against the real
 * backend and IDP. Each resource runs GetAll, GetById, Create, Update, then Delete, and the
 * record it creates is the only one it changes, so the data is left as it was found.
 */
const DEFAULT_PORT = 11001;
const API_URL = /\/api\/(\d+)(\/[^?]*)/;

// A real backend can take several seconds to answer its first request.
const loaded = { timeout: 20_000 };

interface LiveResource {
  readonly key: string;
  /** Record to create, unique to this run; `existing` is the get-all response. */
  readonly createBody: (tag: string, existing: readonly ResourceRecord[]) => ResourceRecord;
  /** Field the update changes, and the value it is changed to. */
  readonly updatedField: string;
  readonly updatedValue: (tag: string) => unknown;
}

// Names stay short: categoryName allows 15 characters and shipCity 15.
const LIVE_RESOURCES: readonly LiveResource[] = [
  {
    key: 'categories',
    createBody: (tag) => ({ categoryName: `E2E ${tag}`, description: 'Live e2e test' }),
    updatedField: 'categoryName',
    updatedValue: (tag) => `Upd ${tag}`,
  },
  {
    key: 'customers',
    createBody: (tag, existing) => ({
      customerId: unusedCustomerId(existing),
      companyName: `E2E ${tag}`,
      city: 'Seattle',
    }),
    updatedField: 'companyName',
    updatedValue: (tag) => `E2E ${tag} updated`,
  },
  {
    key: 'employees',
    createBody: (tag) => ({ firstName: 'E2E', lastName: tag, title: 'Representative' }),
    updatedField: 'title',
    updatedValue: (tag) => `Updated ${tag}`,
  },
  {
    key: 'order-details',
    createBody: (_tag, existing) => ({
      ...unusedOrderLine(existing),
      unitPrice: 18,
      quantity: 10,
      discount: 0,
    }),
    updatedField: 'quantity',
    updatedValue: () => 12,
  },
  {
    key: 'orders',
    createBody: (tag) => ({
      customerId: 'ALFKI',
      employeeId: 1,
      shipName: `E2E ${tag}`,
      shipCity: 'Seattle',
    }),
    updatedField: 'shipCity',
    updatedValue: (tag) => `Upd ${tag}`,
  },
  {
    key: 'products',
    createBody: (tag) => ({ productName: `E2E ${tag}`, unitPrice: 19.99, discontinued: false }),
    updatedField: 'productName',
    updatedValue: (tag) => `E2E ${tag} updated`,
  },
  {
    key: 'shippers',
    createBody: (tag) => ({ companyName: `E2E ${tag}`, phone: '555-0110' }),
    updatedField: 'companyName',
    updatedValue: (tag) => `E2E ${tag} updated`,
  },
  {
    key: 'suppliers',
    createBody: (tag) => ({ companyName: `E2E ${tag}`, city: 'Seattle' }),
    updatedField: 'companyName',
    updatedValue: (tag) => `E2E ${tag} updated`,
  },
];

test.describe('Live backend endpoints', () => {
  test.describe.configure({ timeout: 60_000 });

  let pageErrors: string[];
  /** Deletes the record a test created, when the test stopped before deleting it. */
  let cleanup: (() => Promise<void>) | null;

  test.beforeEach(({ page }) => {
    pageErrors = [];
    cleanup = null;
    page.on('pageerror', (error) => pageErrors.push(error.message));
  });

  // Unlike a finally block, this still runs when the test times out.
  test.afterEach(async () => {
    await cleanup?.();
    expect(pageErrors, 'uncaught page errors').toEqual([]);
  });

  for (const live of LIVE_RESOURCES) {
    const resource = RESOURCES.find((item) => item.key === live.key)!;
    const base = `/v1/${resource.key}`;

    test(`${resource.navLabel} handles GetAll, GetById, Create, Update and Delete`, async ({
      page,
    }) => {
      const tag = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
      const resourcePage = new ResourcePage(page);
      const calls = recordEndpointCalls(page, base);

      const existing = await test.step('GetAll lists the records', async () => {
        const response = await expectCall(page, 'GET', `${base}/get-all`, 200, () =>
          resourcePage.goto(resource.key),
        );
        const records = (await response.json()) as ResourceRecord[];
        expect(records.length).toBeGreaterThan(0);

        await expect(resourcePage.listItems.first()).toBeVisible(loaded);
        await resourcePage.expectTotal(records.length);
        await expect(resourcePage.listError).toBeHidden();
        return records;
      });

      await test.step('GetById fetches an existing record', async () => {
        const record = existing[0]!;
        await openOperation(resourcePage, 'Get', 'Get By Id');
        await fillIds(page, resource, record);

        const response = await expectCall(
          page,
          'GET',
          `${base}/get/${idPath(resource, record)}`,
          200,
          () => resourcePage.button('Get By Id').click(),
        );

        await expect(resourcePage.resultStatus).toHaveText('Succeeded', loaded);
        expect(pickIds(resource, await response.json())).toEqual(pickIds(resource, record));
      });

      const created = await test.step('Create adds a record', async () => {
        const body = live.createBody(tag, existing);
        await openOperation(resourcePage, 'Create', 'Create');
        await fillPayload(resourcePage, body);

        const reloaded = waitForCall(page, 'GET', `${base}/get-all`);
        const response = await expectCall(page, 'POST', `${base}/add`, 201, () =>
          resourcePage.button('Create').click(),
        );
        const record = { ...body, ...createdIds(resource, await response.json()) };
        cleanup = () => deleteThroughUi(resourcePage, resource, record);

        await expect(resourcePage.resultStatus).toHaveText('Succeeded', loaded);
        expect(findRecord(resource, await (await reloaded).json(), record)).toBeDefined();
        return record;
      });

      await test.step('Update changes the created record', async () => {
        const body = { ...created, [live.updatedField]: live.updatedValue(tag) };
        await openOperation(resourcePage, 'Update', 'Update');
        await fillPayload(resourcePage, body);

        const reloaded = waitForCall(page, 'GET', `${base}/get-all`);
        await expectCall(page, 'PUT', `${base}/update`, 204, () =>
          resourcePage.button('Update').click(),
        );

        await expect(resourcePage.resultStatus).toHaveText(
          'Succeeded (no content returned)',
          loaded,
        );
        const record = findRecord(resource, await (await reloaded).json(), body);
        expect(record?.[live.updatedField]).toEqual(live.updatedValue(tag));
      });

      await test.step('Delete removes the created record', async () => {
        const record = created;
        await openOperation(resourcePage, 'Delete', 'Delete');
        await fillIds(page, resource, record);

        const reloaded = waitForCall(page, 'GET', `${base}/get-all`);
        await expectCall(page, 'DELETE', `${base}/delete/${idPath(resource, record)}`, 204, () =>
          resourcePage.button('Delete').click(),
        );
        cleanup = null;

        await expect(resourcePage.resultStatus).toHaveText(
          'Succeeded (no content returned)',
          loaded,
        );
        expect(findRecord(resource, await (await reloaded).json(), record)).toBeUndefined();
      });

      // Each mutation reloads the list, so only the first get-all is a step of its own.
      expect(calls.filter((call, index) => index === 0 || !call.endsWith('/get-all'))).toEqual([
        `GET ${base}/get-all`,
        expect.stringMatching(new RegExp(`^GET ${base}/get/`)),
        `POST ${base}/add`,
        `PUT ${base}/update`,
        expect.stringMatching(new RegExp(`^DELETE ${base}/delete/`)),
      ]);
    });
  }

  test('System runs Healthcheck and About', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('system');

    await expectCall(page, 'GET', '/healthcheck', 200, () =>
      resourcePage.button('Run Healthcheck').click(),
    );
    await expect(
      page.locator('.details-panel').filter({ hasText: 'Latest healthcheck result' }),
    ).toBeVisible(loaded);

    await expectCall(page, 'GET', '/about', 200, () => resourcePage.button('Load About').click());
    await expect(
      page.locator('.details-panel').filter({ hasText: 'About response' }),
    ).toContainText('"apiVersion"', loaded);
    await expect(page.getByRole('alert')).toBeHidden();
  });
});

/** Records `METHOD /path` for each response from a resource's endpoints on the default port. */
function recordEndpointCalls(page: Page, base: string): string[] {
  const calls: string[] = [];
  page.on('response', (response) => {
    const path = apiPath(response);
    if (path?.startsWith(`${base}/`)) {
      calls.push(`${response.request().method()} ${path}`);
    }
  });
  return calls;
}

function waitForCall(page: Page, method: string, path: string): Promise<Response> {
  return page.waitForResponse(
    (response) => response.request().method() === method && apiPath(response) === path,
    loaded,
  );
}

/** Runs the action and checks it called the endpoint on the default data source. */
async function expectCall(
  page: Page,
  method: string,
  path: string,
  status: number,
  action: () => Promise<unknown>,
): Promise<Response> {
  const response = waitForCall(page, method, path);
  await action();
  const result = await response;
  expect(result.status(), `${method} ${path}`).toBe(status);
  return result;
}

/** The API path of a default data source response, or undefined for any other request. */
function apiPath(response: Response): string | undefined {
  const match = API_URL.exec(response.url());
  return Number(match?.[1]) === DEFAULT_PORT ? decodeURI(match?.[2] ?? '') : undefined;
}

/**
 * Selects an operation and waits for its form. Until the page re-renders, the previous
 * operation's inputs are still present, and filling them would leave the page's defaults,
 * which address existing records, in the request.
 */
async function openOperation(
  resourcePage: ResourcePage,
  operation: 'Get' | 'Create' | 'Update' | 'Delete',
  actionButton: string,
): Promise<void> {
  await resourcePage.selectOperation(operation);
  await expect(resourcePage.button(actionButton)).toBeVisible();
}

async function fillPayload(resourcePage: ResourcePage, body: ResourceRecord): Promise<void> {
  const text = JSON.stringify(body);
  await resourcePage.payload.fill(text);
  await expect(resourcePage.payload).toHaveValue(text);
}

async function fillIds(
  page: Page,
  resource: ResourceDefinition,
  record: ResourceRecord,
): Promise<void> {
  const [primary, secondary] = resource.idFields;
  const primaryInput = page.getByLabel(resource.primaryIdLabel);
  await primaryInput.fill(String(record[primary!]));
  await expect(primaryInput).toHaveValue(String(record[primary!]));
  if (resource.secondaryIdLabel) {
    const secondaryInput = page.getByLabel(resource.secondaryIdLabel);
    await secondaryInput.fill(String(record[secondary!]));
    await expect(secondaryInput).toHaveValue(String(record[secondary!]));
  }
}

function idPath(resource: ResourceDefinition, record: ResourceRecord): string {
  return resource.key === 'order-details'
    ? `product/${record['productId']}/order/${record['orderId']}`
    : encodeURIComponent(String(record[resource.idFields[0]!]));
}

function pickIds(resource: ResourceDefinition, record: ResourceRecord): ResourceRecord {
  return Object.fromEntries(resource.idFields.map((field) => [field, record[field]]));
}

/** The add response is `{ id }`, or `{ productId, orderId }` for order details. */
function createdIds(resource: ResourceDefinition, response: ResourceRecord): ResourceRecord {
  return resource.idFields.length > 1
    ? pickIds(resource, response)
    : { [resource.idFields[0]!]: response['id'] };
}

function findRecord(
  resource: ResourceDefinition,
  records: readonly ResourceRecord[],
  target: ResourceRecord,
): ResourceRecord | undefined {
  return records.find((record) =>
    resource.idFields.every((field) => String(record[field]) === String(target[field])),
  );
}

/** Customer IDs are five characters and are not generated by the API. */
function unusedCustomerId(existing: readonly ResourceRecord[]): string {
  const taken = new Set(existing.map((record) => record['customerId']));
  let id: string;
  do {
    id = `Z${Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0')}`;
  } while (taken.has(id));
  return id;
}

/** An existing order paired with an existing product it does not already contain. */
function unusedOrderLine(existing: readonly ResourceRecord[]): ResourceRecord {
  const orderId = existing[0]!['orderId'];
  const onOrder = new Set(
    existing.filter((line) => line['orderId'] === orderId).map((line) => line['productId']),
  );
  const productId = [...new Set(existing.map((line) => line['productId']))]
    .sort((left, right) => Number(left) - Number(right))
    .find((id) => !onOrder.has(id));
  expect(productId, `a product not already on order ${orderId}`).toBeDefined();
  return { productId, orderId };
}

/** Best-effort cleanup when a step fails after the record was created. */
async function deleteThroughUi(
  resourcePage: ResourcePage,
  resource: ResourceDefinition,
  record: ResourceRecord,
): Promise<void> {
  try {
    await resourcePage.goto(resource.key);
    await openOperation(resourcePage, 'Delete', 'Delete');
    await fillIds(resourcePage.page, resource, record);
    await resourcePage.button('Delete').click();
    await expect(resourcePage.resultStatus).toHaveText('Succeeded (no content returned)', loaded);
  } catch (error) {
    console.warn(`Could not delete ${resource.key} record ${JSON.stringify(record)}.`);
    throw error;
  }
}
