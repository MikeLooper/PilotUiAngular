import { effect, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { DataSourceService } from '../../core/services/data-source';
import { ApiClient } from '../generated';

export abstract class BaseResourceApiFacade<TItem> {
  protected readonly apiClient = inject(ApiClient);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly clearCacheOnDataSourceChange = effect(() => {
    this.dataSourceService.activeDataSource();
    this.clearCache();
  });

  private cachedAll$?: Observable<readonly TItem[]>;

  /** Emits null when the API answers 204 No Content, which the generated client does not type. */
  protected abstract fetchAll(): Observable<readonly TItem[] | null>;

  protected getAllCached(forceRefresh = false): Observable<readonly TItem[]> {
    if (forceRefresh || !this.cachedAll$) {
      this.cachedAll$ = this.fetchAll().pipe(
        map((items) => items ?? []),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }

    return this.cachedAll$;
  }

  protected clearCache(): void {
    this.cachedAll$ = undefined;
  }
}
