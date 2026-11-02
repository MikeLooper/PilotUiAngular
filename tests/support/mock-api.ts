import { Page, Request, Route } from '@playwright/test';
import { RESOURCES, ResourceDefinition, ResourceRecord } from './resources';

export const DEFAULT_PORT = 11001;
export const MOCK_TOKEN = 'mock-access-token';
export const MOCK_SECRETS = { username: 'e2e-user', password: 'e2e-password' };

export interface RecordedRequest {
  readonly method: string;
  /** Source API port the request was addressed to, for example 11001. */
  readonly port: number;
  /** Path as the API sees it, for example /v1/categories/get/1. */
  readonly path: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
}

export interface MockFailure {
  readonly status?: number;
  readonly body?: unknown;
  /** Drops the connection instead of responding. */
  readonly abort?: boolean;
}

interface FailureRule extends MockFailure {
  readonly method: string;
  readonly path: string;
}

const API_URL = /\/api\/(\d+)(\/[^?]*)/;

/**
 * Stateful stand-in for the Pilot API and IDP, served through Playwright routing so the
 * dev-server proxy is never reached. Follows the status codes and bodies in
 * shared/PilotSharedSource/OpenAPI/PilotApi_v1.yaml, and rejects domain requests that have no
 * bearer token.
 */
export class MockApi {
  public readonly requests: RecordedRequest[] = [];
  public readonly unhandled: string[] = [];
  public readonly tokenRequests: { readonly body: string }[] = [];

  private readonly records = new Map<string, ResourceRecord[]>(
    RESOURCES.map((definition) => [definition.key, definition.seed.map((item) => ({ ...item }))]),
  );
  private failures: FailureRule[] = [];
  private tokenStatus = 200;

  public async install(page: Page): Promise<void> {
    await page.route('**/security-token-secrets.json', (route) =>
      route.fulfill({ json: MOCK_SECRETS }),
    );
    await page.route('**/idp/realms/*/protocol/openid-connect/token', (route) =>
      this.handleToken(route),
    );
    await page.route(API_URL, (route) => this.handleApi(route));
  }

  /** Replaces the records a resource's get-all returns. */
  public seed(key: string, records: readonly ResourceRecord[]): void {
    this.records.set(
      key,
      records.map((item) => ({ ...item })),
    );
  }

  /** Makes the next matching request fail. */
  public failNext(method: string, path: string, failure: MockFailure): void {
    this.failures.push({ method, path, ...failure });
  }

  public failTokenRequests(status: number): void {
    this.tokenStatus = status;
  }

  public requestsTo(method: string, path: string | RegExp): RecordedRequest[] {
    return this.requests.filter(
      (request) =>
        request.method === method &&
        (typeof path === 'string' ? request.path === path : path.test(request.path)),
    );
  }

  private async handleToken(route: Route): Promise<void> {
    this.tokenRequests.push({ body: route.request().postData() ?? '' });

    if (this.tokenStatus !== 200) {
      await route.fulfill({ status: this.tokenStatus, json: { error: 'invalid_grant' } });
      return;
    }

    await route.fulfill({ json: { access_token: MOCK_TOKEN, expires_in: 300 } });
  }

  private async handleApi(route: Route): Promise<void> {
    const request = route.request();
    const match = API_URL.exec(request.url());
    const port = Number(match?.[1]);
    const path = decodeURI(match?.[2] ?? '');
    const method = request.method();

    this.requests.push({ method, port, path, headers: request.headers(), body: readBody(request) });

    const failure = this.takeFailure(method, path);
    if (failure) {
      if (failure.abort) {
        await route.abort('connectionrefused');
      } else {
        await route.fulfill({ status: failure.status ?? 500, json: failure.body ?? {} });
      }
      return;
    }

    if (path === '/healthcheck') {
      await route.fulfill({ json: 'OK' });
      return;
    }

    if (path === '/about') {
      await route.fulfill({
        json: {
          name: 'Mock Pilot API',
          apiVersion: `1.0.${port}`,
          buildVersion: '42',
          deployDate: '2026-01-15',
        },
      });
      return;
    }

    if (path.startsWith('/v1/')) {
      if (request.headers()['authorization'] !== `Bearer ${MOCK_TOKEN}`) {
        await route.fulfill({ status: 401, json: { title: 'Unauthorized' } });
        return;
      }

      const definition = RESOURCES.find((item) => path.startsWith(`/v1/${item.key}/`));
      if (definition) {
        await this.handleResource(route, definition, path.slice(`/v1/${definition.key}/`.length));
        return;
      }
    }

    await this.rejectUnhandled(route, `${method} ${path}`);
  }

  private async handleResource(
    route: Route,
    definition: ResourceDefinition,
    action: string,
  ): Promise<void> {
    const records = this.records.get(definition.key) ?? [];
    const method = route.request().method();

    if (method === 'GET' && action === 'get-all') {
      // The API answers an empty collection with 204 No Content.
      await (records.length === 0
        ? route.fulfill({ status: 204 })
        : route.fulfill({ json: records }));
      return;
    }

    if (method === 'POST' && action === 'add') {
      const created = { ...(readBody(route.request()) as ResourceRecord) };
      if (definition.generatedIdField) {
        created[definition.generatedIdField] = nextId(records, definition.generatedIdField);
      }
      if (records.some((item) => sameRecord(definition, item, created))) {
        await route.fulfill({ status: 409, json: { title: 'Duplicate key' } });
        return;
      }
      records.push(created);
      await route.fulfill({ status: 201, json: toAddResponse(definition, created) });
      return;
    }

    if (method === 'PUT' && action === 'update') {
      const updated = readBody(route.request()) as ResourceRecord;
      const index = records.findIndex((item) => sameRecord(definition, item, updated));
      if (index < 0) {
        await route.fulfill({ status: 404, json: { title: 'Not Found' } });
        return;
      }
      records[index] = { ...records[index], ...updated };
      await route.fulfill({ status: 204 });
      return;
    }

    const ids = parseIds(action);
    if (ids.includes('NaN')) {
      await route.fulfill({
        status: 400,
        json: { title: 'Validation failed', errors: { id: ['The ID must be a number.'] } },
      });
      return;
    }

    const index = records.findIndex((item) =>
      definition.idFields.every((field, position) => String(item[field]) === ids[position]),
    );

    if (method === 'GET' && action.startsWith('get/')) {
      await (index < 0
        ? route.fulfill({ status: 404, json: { title: 'Not Found' } })
        : route.fulfill({ json: records[index] }));
    } else if (method === 'DELETE' && action.startsWith('delete/')) {
      if (index < 0) {
        await route.fulfill({ status: 404, json: { title: 'Not Found' } });
        return;
      }
      records.splice(index, 1);
      await route.fulfill({ status: 204 });
    } else {
      await this.rejectUnhandled(route, `${method} /v1/${definition.key}/${action}`);
    }
  }

  private async rejectUnhandled(route: Route, description: string): Promise<void> {
    this.unhandled.push(description);
    await route.fulfill({ status: 501, json: { title: `Not mocked: ${description}` } });
  }

  private takeFailure(method: string, path: string): FailureRule | undefined {
    const rule = this.failures.find((item) => item.method === method && item.path === path);
    this.failures = this.failures.filter((item) => item !== rule);
    return rule;
  }
}

function readBody(request: Request): unknown {
  const text = request.postData();
  if (text === null) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** get/1 → ['1']; delete/product/1/order/10248 → ['1', '10248'] */
function parseIds(action: string): string[] {
  const segments = action.split('/').slice(1);
  return segments[0] === 'product' ? [segments[1] ?? '', segments[3] ?? ''] : segments;
}

function sameRecord(
  definition: ResourceDefinition,
  left: ResourceRecord,
  right: ResourceRecord,
): boolean {
  return definition.idFields.every((field) => String(left[field]) === String(right[field]));
}

function nextId(records: readonly ResourceRecord[], field: string): number {
  return Math.max(0, ...records.map((item) => Number(item[field]))) + 1;
}

function toAddResponse(definition: ResourceDefinition, created: ResourceRecord): object {
  const [first, second] = definition.idFields as readonly [string, string?];
  return second ? { [first]: created[first], [second]: created[second] } : { id: created[first] };
}
