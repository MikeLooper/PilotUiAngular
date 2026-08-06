export interface DataSourceOption {
  readonly id: string;
  readonly description: string;
  readonly basePort: number;
}

export const DATA_SOURCE_OPTIONS: readonly DataSourceOption[] = [
  {
    id: 'dotnet-sqlserver',
    description: '.NET Core application with SQL Server',
    basePort: 55551,
  },
  {
    id: 'dotnet-postgresql',
    description: '.NET Core application with PostgreSQL',
    basePort: 55552,
  },
  {
    id: 'java-sqlserver',
    description: 'Java Spring Boot application with SQL Server',
    basePort: 56661,
  },
  {
    id: 'java-postgresql',
    description: 'Java Spring Boot application with PostgreSQL',
    basePort: 56662,
  },
];

export const DEFAULT_DATA_SOURCE: DataSourceOption = DATA_SOURCE_OPTIONS[0]!;

export function getDataSourceBaseUrl(basePort: number): string {
  return `http://localhost:${basePort}`;
}

export function getDataSourceApiBaseUrl(basePort: number, configuredBaseUrl: string): string {
  // Development uses relative proxy paths; production uses direct localhost URLs.
  if (configuredBaseUrl.startsWith('/')) {
    return `${normalizeBaseUrl(configuredBaseUrl)}/${basePort}`;
  }

  return getDataSourceBaseUrl(basePort);
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function resolveDataSourceByBaseUrl(baseUrl: string): DataSourceOption | undefined {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return DATA_SOURCE_OPTIONS.find(
    (source) => getDataSourceBaseUrl(source.basePort) === normalizedBaseUrl
  );
}