import { TestBed } from '@angular/core/testing';

import { ApiClient } from '../../api/generated';
import { environment } from '../../../environments/environment.development';
import { APP_ENV, AppEnvironment } from '../config/app-config';
import { DataSourceService } from './data-source';

describe('DataSourceService', () => {
  let apiClient: Pick<ApiClient, 'rootUrl'>;

  function createService(apiBaseUrl = '/api'): DataSourceService {
    const appEnvironment: AppEnvironment = { ...environment, apiBaseUrl };
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ENV, useValue: appEnvironment },
        { provide: ApiClient, useValue: apiClient },
      ],
    });
    return TestBed.inject(DataSourceService);
  }

  beforeEach(() => {
    apiClient = { rootUrl: '' };
  });

  it('creates the service', () => {
    const service = createService();

    expect(service).toBeTruthy();
  });

  describe('options', () => {
    it('lists every configured data source', () => {
      const service = createService();

      const ids = service.options.map((option) => option.id);

      expect(ids).toEqual([
        'dotnet-sqlserver',
        'dotnet-postgresql',
        'java-sqlserver',
        'java-postgresql',
        'python-sqlserver',
        'python-postgresql',
      ]);
    });
  });

  describe('activeDataSource', () => {
    it('defaults to the first option when the base URL matches no data source', () => {
      const service = createService('/api');

      const active = service.activeDataSource();

      expect(active.id).toBe('dotnet-sqlserver');
    });

    it('starts on the data source whose direct URL matches the configured base URL', () => {
      const service = createService('http://localhost:11201/');

      const active = service.activeDataSource();

      expect(active.id).toBe('java-sqlserver');
    });
  });

  describe('activeBaseUrl', () => {
    it('returns the proxy URL of the active data source for a relative base URL', () => {
      const service = createService('/api');

      const baseUrl = service.activeBaseUrl();

      expect(baseUrl).toBe('/api/11001');
    });

    it('returns the direct URL of the active data source for an absolute base URL', () => {
      const service = createService('http://localhost:11201');

      const baseUrl = service.activeBaseUrl();

      expect(baseUrl).toBe('http://localhost:11201');
    });
  });

  describe('constructor', () => {
    it('points the API client at the initial data source', () => {
      createService('/api/');

      const rootUrl = apiClient.rootUrl;

      expect(rootUrl).toBe('/api/11001');
    });
  });

  describe('selectDataSourceById', () => {
    it('switches the active data source and base URL', () => {
      const service = createService('/api');

      service.selectDataSourceById('python-postgresql');

      expect(service.activeDataSource().id).toBe('python-postgresql');
      expect(service.activeBaseUrl()).toBe('/api/11501');
    });

    it('points the API client at the newly selected data source', () => {
      const service = createService('/api');

      service.selectDataSourceById('java-postgresql');

      expect(apiClient.rootUrl).toBe('/api/11301');
    });

    it('ignores an unknown id', () => {
      const service = createService('/api');

      service.selectDataSourceById('cobol-db2');

      expect(service.activeDataSource().id).toBe('dotnet-sqlserver');
      expect(apiClient.rootUrl).toBe('/api/11001');
    });

    it('leaves the API client untouched when the id is already active', () => {
      const service = createService('/api');
      apiClient.rootUrl = 'sentinel';

      service.selectDataSourceById('dotnet-sqlserver');

      expect(apiClient.rootUrl).toBe('sentinel');
    });
  });
});
