import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '../../api/generated';
import { APP_ENV } from '../config/app-config';
import {
  DATA_SOURCE_OPTIONS,
  DEFAULT_DATA_SOURCE,
  DataSourceOption,
  getDataSourceApiBaseUrl,
  normalizeBaseUrl,
  resolveDataSourceByBaseUrl,
} from '../config/data-sources';

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  private readonly apiClient = inject(ApiClient);
  private readonly env = inject(APP_ENV);

  public readonly options = DATA_SOURCE_OPTIONS;

  private readonly selectedDataSourceState = signal<DataSourceOption>(
    this.resolveInitialDataSource()
  );

  public readonly activeDataSource = computed(() => this.selectedDataSourceState());
  public readonly activeBaseUrl = computed(() =>
    getDataSourceApiBaseUrl(this.selectedDataSourceState().basePort, this.env.apiBaseUrl)
  );

  public constructor() {
    this.syncApiClientRootUrl(this.activeBaseUrl());
  }

  public selectDataSourceById(id: string): void {
    const source = this.options.find((item) => item.id === id);
    if (!source || source.id === this.selectedDataSourceState().id) {
      return;
    }

    this.selectedDataSourceState.set(source);
    this.syncApiClientRootUrl(this.activeBaseUrl());
  }

  private resolveInitialDataSource(): DataSourceOption {
    return resolveDataSourceByBaseUrl(this.env.apiBaseUrl) ?? DEFAULT_DATA_SOURCE;
  }

  private syncApiClientRootUrl(baseUrl: string): void {
    this.apiClient.rootUrl = normalizeBaseUrl(baseUrl);
  }
}