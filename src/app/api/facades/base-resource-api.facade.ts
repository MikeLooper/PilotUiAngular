import { inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiClient } from '../generated';

export abstract class BaseResourceApiFacade<TItem> {
  protected readonly apiClient = inject(ApiClient);

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
