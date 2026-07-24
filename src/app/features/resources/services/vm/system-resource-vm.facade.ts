import { Injectable, signal } from '@angular/core';
import { SystemApiFacade } from '../../../../api/facades/system-api.facade';
import { SystemVmFacade, SystemVmState } from './resource-vm.models';

const initialSystemState: SystemVmState = {
  isLoading: false,
  healthcheckResult: null,
  errorMessage: null,
};

@Injectable({ providedIn: 'root' })
export class SystemResourceVmFacade implements SystemVmFacade {
  public readonly key = 'system' as const;
  public readonly heading = 'System API';
  public readonly description = 'Run backend health checks from a dedicated page.';

  private readonly state = signal<SystemVmState>(initialSystemState);
  public readonly vm = this.state.asReadonly();

  public constructor(private readonly systemApiFacade: SystemApiFacade) {}

  public runHealthcheck(): void {
    this.state.update((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));

    this.systemApiFacade.getHealthcheck().subscribe({
      next: (result) => {
        this.state.update((current) => ({
          ...current,
          isLoading: false,
          healthcheckResult: result,
          errorMessage: null,
        }));
      },
      error: (error: unknown) => {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? ((error as { message?: string }).message ?? 'Request failed.')
            : 'Request failed.';

        this.state.update((current) => ({
          ...current,
          isLoading: false,
          errorMessage: message,
        }));
      },
    });
  }
}
