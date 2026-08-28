import { effect, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { DataSourceService } from '../../core/services/data-source';
import { DomainApiClient } from './domain-api-client';

export abstract class BaseResourceApiFacade<TItem> {
  protected readonly apiClient = inject(DomainApiClient);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly clearCacheOnDataSourceChange = effect(() => {
    this.dataSourceService.activeDataSource();
    this.clearCache();
  });

  private cachedAll$?: Observable<readonly TItem[]>;

  protected abstract fetchAll(): Observable<readonly TItem[]>;

  protected getAllCached(forceRefresh = false): Observable<readonly TItem[]> {
    if (forceRefresh || !this.cachedAll$) {
      this.cachedAll$ = this.fetchAll().pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }

    return this.cachedAll$;
  }

  protected clearCache(): void {
    this.cachedAll$ = undefined;
  }
}
