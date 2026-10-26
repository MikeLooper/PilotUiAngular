import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApiService } from './api';
import { DataSourceService } from './data-source';

describe('ApiService', () => {
  let service: ApiService;
  let activeBaseUrl: WritableSignal<string>;

  beforeEach(() => {
    activeBaseUrl = signal('http://localhost:11401');
    const dataSourceDouble: Partial<DataSourceService> = {
      activeBaseUrl: activeBaseUrl.asReadonly(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: DataSourceService, useValue: dataSourceDouble }],
    });
    service = TestBed.inject(ApiService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('baseUrl', () => {
    it('returns the active data source base URL', () => {
      const baseUrl = service.baseUrl;

      expect(baseUrl).toBe('http://localhost:11401');
    });

    it('reflects a change of the active data source', () => {
      activeBaseUrl.set('/api/11001');

      const baseUrl = service.baseUrl;

      expect(baseUrl).toBe('/api/11001');
    });
  });

  describe('buildUrl', () => {
    it('joins a path that starts with a slash to the base URL', () => {
      const url = service.buildUrl('/v1/categories/get-all');

      expect(url).toBe('http://localhost:11401/v1/categories/get-all');
    });

    it('inserts a slash before a path that does not start with one', () => {
      const url = service.buildUrl('about');

      expect(url).toBe('http://localhost:11401/about');
    });

    it('returns the base URL followed by a slash for an empty path', () => {
      const url = service.buildUrl('');

      expect(url).toBe('http://localhost:11401/');
    });
  });
});
