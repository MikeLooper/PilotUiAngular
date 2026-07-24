import { Injectable, signal } from '@angular/core';
import { SystemApiFacade } from '../../../api/facades/system-api.facade';
import { initialResourcePanelState, ResourcePanelState } from './resource-panel-state';

@Injectable({ providedIn: 'root' })
export class SystemResourceService {
  public readonly state = signal<ResourcePanelState>(initialResourcePanelState);

  public constructor(private readonly systemApiFacade: SystemApiFacade) {}

  public runHealthcheck(): void {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    this.systemApiFacade.getHealthcheck().subscribe({
      next: (value) => {
        this.state.update((current) => ({
          ...current,
          loading: false,
          itemResult: value,
          error: null,
        }));
      },
      error: (error: unknown) => {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? ((error as { message?: string }).message ?? 'Request failed')
            : 'Request failed';

        this.state.update((current) => ({
          ...current,
          loading: false,
          error: message,
        }));
      },
    });
  }
}
