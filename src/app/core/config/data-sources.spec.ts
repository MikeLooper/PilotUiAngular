import { environment } from '../../../environments/environment.development';
import { AppEnvironment } from './app-config';
import {
  DataSourceOption,
  buildDataSourceOptions,
  getDataSourceApiBaseUrl,
  getDataSourceBaseUrl,
  normalizeBaseUrl,
  resolveDataSourceByBaseUrl,
} from './data-sources';

const JAVA_SQLSERVER: DataSourceOption = {
  id: 'java-sqlserver',
  description: 'Java Spring Boot application with SQL Server',
  baseHostname: 'api.local',
  basePort: 11201,
};

describe('data-sources', () => {
  describe('buildDataSourceOptions', () => {
    it('returns one option per catalog entry in catalog order', () => {
      const options = buildDataSourceOptions(environment);

      expect(options.map((option) => option.id)).toEqual([
        'dotnet-sqlserver',
        'dotnet-postgresql',
        'java-sqlserver',
        'java-postgresql',
        'python-sqlserver',
        'python-postgresql',
      ]);
    });

    it('takes the hostname and port of each option from the environment connections', () => {
      const appEnvironment: AppEnvironment = {
        ...environment,
        sourceApiConnections: {
          ...environment.sourceApiConnections,
          'java-sqlserver': { hostname: 'api.local', port: 9999 },
        },
      };

      const options = buildDataSourceOptions(appEnvironment);

      expect(options[2]).toEqual({
        id: 'java-sqlserver',
        description: 'Java Spring Boot application with SQL Server',
        baseHostname: 'api.local',
        basePort: 9999,
      });
    });
  });

  describe('getDataSourceBaseUrl', () => {
    it('builds an http URL from the hostname and port', () => {
      const url = getDataSourceBaseUrl('localhost', 11001);

      expect(url).toBe('http://localhost:11001');
    });
  });

  describe('getDataSourceApiBaseUrl', () => {
    it('appends the port to a relative proxy base URL', () => {
      const url = getDataSourceApiBaseUrl(JAVA_SQLSERVER, '/api');

      expect(url).toBe('/api/11201');
    });

    it('drops trailing slashes from a relative proxy base URL before appending the port', () => {
      const url = getDataSourceApiBaseUrl(JAVA_SQLSERVER, '/api//');

      expect(url).toBe('/api/11201');
    });

    it('uses the direct source URL when the configured base URL is absolute', () => {
      const url = getDataSourceApiBaseUrl(JAVA_SQLSERVER, 'http://localhost:4200');

      expect(url).toBe('http://api.local:11201');
    });
  });

  describe('normalizeBaseUrl', () => {
    it.each([
      { input: 'http://localhost:11001', expected: 'http://localhost:11001' },
      { input: 'http://localhost:11001/', expected: 'http://localhost:11001' },
      { input: '/api///', expected: '/api' },
      { input: '', expected: '' },
    ])('normalizes "$input" to "$expected"', ({ input, expected }) => {
      const result = normalizeBaseUrl(input);

      expect(result).toBe(expected);
    });
  });

  describe('resolveDataSourceByBaseUrl', () => {
    const options = buildDataSourceOptions(environment);

    it('returns the option whose direct URL matches the base URL', () => {
      const result = resolveDataSourceByBaseUrl('http://localhost:11301', options);

      expect(result?.id).toBe('java-postgresql');
    });

    it('ignores trailing slashes on the base URL', () => {
      const result = resolveDataSourceByBaseUrl('http://localhost:11301/', options);

      expect(result?.id).toBe('java-postgresql');
    });

    it('returns undefined when no option matches', () => {
      const result = resolveDataSourceByBaseUrl('/api', options);

      expect(result).toBeUndefined();
    });

    it('returns undefined for an empty option list', () => {
      const result = resolveDataSourceByBaseUrl('http://localhost:11301', []);

      expect(result).toBeUndefined();
    });
  });
});
