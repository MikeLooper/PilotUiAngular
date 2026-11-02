import { expect, test } from '../support/fixtures';
import { ResourcePage } from '../support/resource-page';
import { RESOURCES } from '../support/resources';

for (const resource of RESOURCES) {
  const defaultRecord = resource.seed[0]!;
  const defaultIdPath =
    resource.key === 'order-details'
      ? `product/${defaultRecord['productId']}/order/${defaultRecord['orderId']}`
      : String(defaultRecord[resource.idFields[0]!]);

  test.describe(`${resource.navLabel} CRUD`, () => {
    test('Load All lists the records', async ({ page, mockApi }) => {
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto(resource.key);

      await expect(page.getByRole('radio', { name: 'Load All' })).toBeChecked();
      await expect(resourcePage.listItems).toHaveCount(resource.seed.length);
      await expect(
        resourcePage.titles.filter({ hasText: resource.defaultRecordTitle }),
      ).toBeVisible();
      await resourcePage.expectTotal(resource.seed.length);
      expect(mockApi.requestsTo('GET', `/v1/${resource.key}/get-all`)).toHaveLength(1);
    });

    test('Get fetches the default record', async ({ page, mockApi }) => {
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto(resource.key);
      await resourcePage.selectOperation('Get');

      await expect(page.getByLabel(resource.primaryIdLabel)).not.toHaveValue('');
      if (resource.secondaryIdLabel) {
        await expect(page.getByLabel(resource.secondaryIdLabel)).not.toHaveValue('');
      }
      await resourcePage.button('Get By Id').click();

      await expect(resourcePage.resultStatus).toHaveText('Succeeded');
      expect(mockApi.requestsTo('GET', `/v1/${resource.key}/get/${defaultIdPath}`)).toHaveLength(1);
      expect(JSON.parse((await resourcePage.resultResponse.textContent()) ?? '')).toEqual(
        defaultRecord,
      );
    });

    test('Create posts the sample and the list gains the record', async ({ page, mockApi }) => {
      // The order details sample uses the default key, so leave that key free.
      const seed = resource.key === 'order-details' ? resource.seed.slice(1) : resource.seed;
      mockApi.seed(resource.key, seed);
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto(resource.key);
      await resourcePage.expectTotal(seed.length);
      await resourcePage.selectOperation('Create');

      const sample = JSON.parse(await resourcePage.payload.inputValue());
      await resourcePage.button('Create').click();

      await expect(resourcePage.resultStatus).toHaveText('Succeeded');
      expect(mockApi.requestsTo('POST', `/v1/${resource.key}/add`)[0]?.body).toEqual(sample);

      await resourcePage.selectOperation('Load All');
      await resourcePage.expectTotal(seed.length + 1);
    });

    test('Update sends the sample and the list reflects it', async ({ page, mockApi }) => {
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto(resource.key);
      await resourcePage.selectOperation('Update');

      await resourcePage.button('Load Sample').click();
      const sample = JSON.parse(await resourcePage.payload.inputValue());
      await resourcePage.button('Update').click();

      await expect(resourcePage.resultStatus).toHaveText('Succeeded (no content returned)');
      expect(mockApi.requestsTo('PUT', `/v1/${resource.key}/update`)[0]?.body).toEqual(sample);

      await resourcePage.selectOperation('Load All');
      await expect(
        resourcePage.titles.filter({ hasText: resource.updatedRecordTitle }),
      ).toBeVisible();
      await expect(resourcePage.listItems).toHaveCount(resource.seed.length);
    });

    test('Delete removes the default record', async ({ page, mockApi }) => {
      const resourcePage = new ResourcePage(page);
      await resourcePage.goto(resource.key);
      await expect(resourcePage.listItems).toHaveCount(resource.seed.length);
      await resourcePage.selectOperation('Delete');

      await resourcePage.button('Delete').click();

      await expect(resourcePage.resultStatus).toHaveText('Succeeded (no content returned)');
      expect(
        mockApi.requestsTo('DELETE', `/v1/${resource.key}/delete/${defaultIdPath}`),
      ).toHaveLength(1);

      await resourcePage.selectOperation('Load All');
      await resourcePage.expectTotal(resource.seed.length - 1);
      await expect(
        resourcePage.titles.filter({ hasText: resource.defaultRecordTitle }),
      ).toHaveCount(0);
    });
  });
}

test.describe('Working with a single record', () => {
  test('Load Record fills the body, and edits are sent with Update', async ({ page, mockApi }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('shippers');
    await resourcePage.selectOperation('Update');

    await page.getByLabel('Shipper ID').fill('2');
    await resourcePage.button('Load Record').click();

    await expect(resourcePage.payload).toHaveValue(/United Package/);
    await expect(
      resourcePage.result.getByRole('heading', { name: 'Get By Id result' }),
    ).toBeVisible();

    const record = JSON.parse(await resourcePage.payload.inputValue());
    const edited = { ...record, companyName: 'Renamed Package' };
    await resourcePage.payload.fill(JSON.stringify(edited));
    await resourcePage.button('Update').click();

    await expect(resourcePage.result.getByRole('heading', { name: 'Update result' })).toBeVisible();
    expect(mockApi.requestsTo('PUT', '/v1/shippers/update')[0]?.body).toEqual(edited);

    await resourcePage.selectOperation('Load All');
    await expect(resourcePage.titles.filter({ hasText: 'Renamed Package' })).toBeVisible();
  });

  test('Load Sample on Create restores an edited body', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Create');
    const sample = await resourcePage.payload.inputValue();

    await resourcePage.payload.fill('{}');
    await resourcePage.button('Load Sample').click();

    await expect(resourcePage.payload).toHaveValue(sample);
  });

  test('a result only shows under the operation that produced it', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Get');
    await resourcePage.button('Get By Id').click();
    await expect(resourcePage.result).toBeVisible();

    await resourcePage.selectOperation('Delete');
    await expect(resourcePage.result).toBeHidden();

    await resourcePage.selectOperation('Get');
    await expect(resourcePage.result).toBeVisible();
  });

  test('Get shows the requested ID and mapped fields', async ({ page }) => {
    const resourcePage = new ResourcePage(page);
    await resourcePage.goto('categories');
    await resourcePage.selectOperation('Get');
    await page.getByLabel('Category ID').fill('2');
    await resourcePage.button('Get By Id').click();

    await expect(resourcePage.resultStatus).toHaveText('Succeeded');
    await expect(resourcePage.resultRequest).toContainText('"Category ID": "2"');
    await expect(
      resourcePage.result.getByRole('heading', { name: 'Category profile' }),
    ).toBeVisible();
    await expect(resourcePage.result.locator('dd').filter({ hasText: 'Condiments' })).toBeVisible();
  });
});
