import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);

  public readonly isLoading = computed(() => this.activeRequests() > 0);

  public requestStarted(): void {
    this.activeRequests.update((value) => value + 1);
  }

  public requestFinished(): void {
    this.activeRequests.update((value) => Math.max(0, value - 1));
  }
}
