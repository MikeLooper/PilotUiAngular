import { AppEnvironment, SourceApiId } from './app-config';

export interface DataSourceOption {
  readonly id: string;
  readonly description: string;
  readonly baseHostname: string;
  readonly basePort: number;
}

const DATA_SOURCE_CATALOG: readonly { id: SourceApiId; description: string }[] = [
  {
    id: 'dotnet-sqlserver',
    description: '.NET Core application with SQL Server',
  },
  {
    id: 'dotnet-postgresql',
    description: '.NET Core application with PostgreSQL',
  },
  {
    id: 'java-sqlserver',
    description: 'Java Spring Boot application with SQL Server',
  },
  {
    id: 'java-postgresql',
    description: 'Java Spring Boot application with PostgreSQL',
  },
  {
    id: 'python-sqlserver',
    description: 'Python application with SQL Server',
  },
  {
    id: 'python-postgresql',
    description: 'Python application with PostgreSQL',
  },
];

export function buildDataSourceOptions(environment: AppEnvironment): readonly DataSourceOption[] {
  return DATA_SOURCE_CATALOG.map((entry) => ({
    id: entry.id,
    description: entry.description,
    baseHostname: environment.sourceApiConnections[entry.id].hostname,
    basePort: environment.sourceApiConnections[entry.id].port,
  }));
}

export function getDataSourceBaseUrl(baseHostname: string, basePort: number): string {
  return `http://${baseHostname}:${basePort}`;
}

export function getDataSourceApiBaseUrl(
  source: DataSourceOption,
  configuredBaseUrl: string
): string {
  // Development uses relative proxy paths; production uses direct localhost URLs.
  if (configuredBaseUrl.startsWith('/')) {
    return `${normalizeBaseUrl(configuredBaseUrl)}/${source.basePort}`;
  }

  return getDataSourceBaseUrl(source.baseHostname, source.basePort);
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function resolveDataSourceByBaseUrl(
  baseUrl: string,
  options: readonly DataSourceOption[]
): DataSourceOption | undefined {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return options.find(
    (source) =>
      normalizeBaseUrl(getDataSourceBaseUrl(source.baseHostname, source.basePort)) ===
      normalizedBaseUrl
  );
}