import { AppEnvironment } from '../config/app-config';
import { buildDataSourceOptions, getDataSourceApiBaseUrl } from '../config/data-sources';

// Domain endpoints are versioned under /v1/ in the OpenAPI spec; system endpoints are not.
const DOMAIN_URL_SEGMENT = '/v1/';

export function isDomainApiUrl(url: string): boolean {
  return url.includes(DOMAIN_URL_SEGMENT);
}

/**
 * True for any request (domain or system) sent to one of the configured target APIs,
 * as opposed to other calls such as the security token (IDP) or local asset requests.
 */
export function isTargetApiUrl(url: string, environment: AppEnvironment): boolean {
  return buildDataSourceOptions(environment).some((source) =>
    url.startsWith(`${getDataSourceApiBaseUrl(source, environment.apiBaseUrl)}/`)
  );
}
