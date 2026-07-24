import { signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { initialResourcePanelState, ResourcePanelState } from './resource-panel-state';

interface CrudResourceOperations<TDto> {
  readonly loadAll: () => Observable<readonly TDto[]>;
  readonly getById: (id: number | string, secondId?: number | string) => Observable<TDto>;
  readonly add: (dto: TDto) => Observable<unknown>;
  readonly update: (dto: TDto) => Observable<unknown>;
  readonly delete: (id: number | string, secondId?: number | string) => Observable<unknown>;
}

export class CrudResourceStateService<TDto> {
  public readonly state: WritableSignal<ResourcePanelState> = signal(initialResourcePanelState);

  public constructor(
    private readonly resourceName: string,
    private readonly operations: CrudResourceOperations<TDto>
  ) {}

  public loadAll(): void {
    this.runList(this.operations.loadAll());
  }

  public getById(id: string, secondId?: string): void {
    this.runItem(this.operations.getById(this.parseId(id), this.parseOptionalId(secondId)));
  }

  public addFromJson(payload: string): void {
    const dto = this.parsePayload(payload);
    if (!dto) {
      this.setError(`Invalid ${this.resourceName} payload JSON.`);
      return;
    }

    this.runMutation(this.operations.add(dto));
  }

  public updateFromJson(payload: string): void {
    const dto = this.parsePayload(payload);
    if (!dto) {
      this.setError(`Invalid ${this.resourceName} payload JSON.`);
      return;
    }

    this.runMutation(this.operations.update(dto));
  }

  public deleteById(id: string, secondId?: string): void {
    this.runMutation(this.operations.delete(this.parseId(id), this.parseOptionalId(secondId)));
  }

  protected runList(request$: Observable<readonly unknown[]>): void {
    this.setLoading(true);
    request$.subscribe({
      next: (items) => {
        this.state.update((state) => ({
          ...state,
          listResult: [...items],
          error: null,
          loading: false,
        }));
      },
      error: (error: unknown) => {
        this.setError(this.readError(error));
      },
    });
  }

  protected runItem(request$: Observable<unknown>): void {
    this.setLoading(true);
    request$.subscribe({
      next: (item) => {
        this.state.update((state) => ({
          ...state,
          itemResult: item,
          error: null,
          loading: false,
        }));
      },
      error: (error: unknown) => {
        this.setError(this.readError(error));
      },
    });
  }

  protected runMutation(request$: Observable<unknown>): void {
    this.setLoading(true);
    request$.subscribe({
      next: (result) => {
        this.state.update((state) => ({
          ...state,
          mutationResult: result ?? { success: true },
          error: null,
          loading: false,
        }));
      },
      error: (error: unknown) => {
        this.setError(this.readError(error));
      },
    });
  }

  protected setLoading(loading: boolean): void {
    this.state.update((state) => ({
      ...state,
      loading,
      error: null,
    }));
  }

  protected setError(error: string): void {
    this.state.update((state) => ({
      ...state,
      loading: false,
      error,
    }));
  }

  private parsePayload(payload: string): TDto | null {
    try {
      return JSON.parse(payload) as TDto;
    } catch {
      return null;
    }
  }

  private parseId(value: string): number | string {
    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? value : asNumber;
  }

  private parseOptionalId(value: string | undefined): number | string | undefined {
    if (!value) {
      return undefined;
    }

    return this.parseId(value);
  }

  private readError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: string }).message;
      return message || 'Request failed';
    }

    return 'Request failed';
  }
}
