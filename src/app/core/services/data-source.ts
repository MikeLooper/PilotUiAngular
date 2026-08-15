import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '../../api/generated';
import { APP_ENV } from '../config/app-config';
import {
  buildDataSourceOptions,
  DataSourceOption,
  getDataSourceApiBaseUrl,
  normalizeBaseUrl,
  resolveDataSourceByBaseUrl,
} from '../config/data-sources';

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  private readonly apiClient = inject(ApiClient);
  private readonly env = inject(APP_ENV);

  public readonly options = buildDataSourceOptions(this.env);

  private readonly selectedDataSourceState = signal<DataSourceOption>(
    this.resolveInitialDataSource()
  );

  public readonly activeDataSource = computed(() => this.selectedDataSourceState());
  public readonly activeBaseUrl = computed(() =>
    getDataSourceApiBaseUrl(this.selectedDataSourceState(), this.env.apiBaseUrl)
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
    return resolveDataSourceByBaseUrl(this.env.apiBaseUrl, this.options) ?? this.options[0]!;
  }

  private syncApiClientRootUrl(baseUrl: string): void {
    this.apiClient.rootUrl = normalizeBaseUrl(baseUrl);
  }
}