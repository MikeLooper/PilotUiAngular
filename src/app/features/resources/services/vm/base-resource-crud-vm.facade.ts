import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientError } from '../../../../core/errors/api-error.model';
import {
  ResourceDetailSection,
  ResourcePageDefaults,
  ResourcePageEntryState,
  ResourceCrudState,
  ResourceCrudVmFacade,
  ResourceCrudViewModel,
  ResourceRecord,
} from './resource-vm.models';

interface CrudFacadeMetadata {
  readonly heading: string;
  readonly description: string;
  readonly primaryIdLabel: string;
  readonly secondaryIdLabel?: string;
  readonly defaultPrimaryId: string;
  readonly defaultSecondaryId?: string;
  readonly pageDefaults?: ResourcePageDefaults;
}

const initialState: ResourceCrudState = {
  items: [],
  searchTerm: '',
  page: 1,
  pageSize: 8,
  sortDirection: 'asc',
  selectedItem: null,
  mutationResult: null,
  isLoading: false,
  errorMessage: null,
};

export abstract class BaseResourceCrudVmFacade<TDto>
  implements ResourceCrudVmFacade
{
  public abstract readonly key: ResourceCrudVmFacade['key'];

  public readonly heading: string;
  public readonly description: string;
  public readonly primaryIdLabel: string;
  public readonly secondaryIdLabel?: string;
  public readonly defaultPrimaryId: string;
  public readonly defaultSecondaryId?: string;
  public readonly pageDefaults: ResourcePageDefaults;

  private readonly state = signal<ResourceCrudState>(initialState);

  public readonly vm = computed<ResourceCrudViewModel>(() => {
    const state = this.state();
    const normalizedSearch = state.searchTerm.trim().toLowerCase();

    const filtered = [...state.items]
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.subtitle.toLowerCase().includes(normalizedSearch) ||
          JSON.stringify(item.raw).toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return state.sortDirection === 'asc' ? comparison : comparison * -1;
      });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
    const currentPage = Math.min(state.page, totalPages);
    const startIndex = (currentPage - 1) * state.pageSize;

    return {
      ...state,
      page: currentPage,
      totalItems,
      totalPages,
      pagedItems: filtered.slice(startIndex, startIndex + state.pageSize),
      hasEmptyState: !state.isLoading && !state.errorMessage && totalItems === 0,
    };
  });

  protected constructor(metadata: CrudFacadeMetadata) {
    this.heading = metadata.heading;
    this.description = metadata.description;
    this.primaryIdLabel = metadata.primaryIdLabel;
    this.secondaryIdLabel = metadata.secondaryIdLabel;
    this.defaultPrimaryId = metadata.defaultPrimaryId;
    this.defaultSecondaryId = metadata.defaultSecondaryId;
    this.pageDefaults = {
      initialPrimaryId: metadata.defaultPrimaryId,
      initialSecondaryId: metadata.defaultSecondaryId,
      initialSearchTerm: '',
      initialSortDirection: 'asc',
      pageSize: initialState.pageSize,
      autoLoadOnEnter: true,
      forceRefreshOnEnter: false,
      ...metadata.pageDefaults,
    };
  }

  protected abstract loadAllDtos(forceRefresh: boolean): Observable<readonly TDto[]>;
  protected abstract getByIdDto(primaryId: string, secondaryId?: string): Observable<TDto>;
  protected abstract createSampleDto(): TDto;
  protected abstract updateSampleDto(primaryId?: string, secondaryId?: string): TDto;
  protected abstract addDto(dto: TDto): Observable<unknown>;
  protected abstract updateDto(dto: TDto): Observable<unknown>;
  protected abstract deleteDto(primaryId: string, secondaryId?: string): Observable<void>;
  protected abstract mapDtoToRecord(dto: TDto): ResourceRecord;

  public onPageEnter(): ResourcePageEntryState {
    const pageSize = this.pageDefaults.pageSize ?? initialState.pageSize;
    const searchTerm = this.pageDefaults.initialSearchTerm ?? '';
    const sortDirection = this.pageDefaults.initialSortDirection ?? 'asc';

    this.state.update((current) => ({
      ...current,
      searchTerm,
      sortDirection,
      pageSize,
      page: 1,
      selectedItem: null,
      mutationResult: null,
      errorMessage: null,
    }));

    if (this.pageDefaults.autoLoadOnEnter ?? true) {
      this.reload(this.pageDefaults.forceRefreshOnEnter ?? false);
    }

    return {
      primaryId: this.pageDefaults.initialPrimaryId,
      secondaryId: this.pageDefaults.initialSecondaryId,
    };
  }

  public mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    return this.toFieldSection('Selected record', value);
  }

  public mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.toFieldSection('Last mutation result', value);
  }

  protected mapMutationResultForResource(
    resourceLabel: string,
    idLabel: string,
    value: unknown
  ): readonly ResourceDetailSection[] {
    const payload = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    const operationValue = payload['operation'];
    const operation =
      typeof operationValue === 'string' && operationValue.trim().length > 0
        ? operationValue
        : payload['id'] !== undefined
          ? 'create'
          : 'update';

    const status = this.resolveMutationStatus(payload);
    const action = this.toSentenceCase(operation);
    const idValue = payload['id'] ?? payload['entityId'] ?? payload['key'];

    return [
      this.createFieldsSection(`${resourceLabel} status`, [
        { label: 'Action', value: action },
        { label: 'Status', value: status },
        { label: idLabel, value: idValue },
      ]),
    ];
  }

  public reload(forceRefresh = true): void {
    this.setLoading();
    this.loadAllDtos(forceRefresh).subscribe({
      next: (items) => {
        this.state.update((current) => ({
          ...current,
          items: items.map((item) => this.mapDtoToRecord(item)),
          isLoading: false,
          errorMessage: null,
        }));
      },
      error: (error: unknown) => {
        this.setError(this.resolveErrorMessage(error));
      },
    });
  }

  public setSearchTerm(term: string): void {
    this.state.update((current) => ({
      ...current,
      searchTerm: term,
      page: 1,
    }));
  }

  public toggleSortDirection(): void {
    this.state.update((current) => ({
      ...current,
      sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  public goToPage(page: number): void {
    this.state.update((current) => ({
      ...current,
      page: Math.max(1, page),
    }));
  }

  public fetchById(primaryId: string, secondaryId?: string): void {
    this.setLoading();
    this.getByIdDto(primaryId, secondaryId).subscribe({
      next: (item) => {
        this.state.update((current) => ({
          ...current,
          selectedItem: item,
          isLoading: false,
          errorMessage: null,
        }));
      },
      error: (error: unknown) => {
        this.setError(this.resolveErrorMessage(error));
      },
    });
  }

  public deleteById(primaryId: string, secondaryId?: string): void {
    this.setLoading();
    this.deleteDto(primaryId, secondaryId).subscribe({
      next: () => {
        this.state.update((current) => ({
          ...current,
          mutationResult: { success: true, operation: 'delete' },
          isLoading: false,
          errorMessage: null,
        }));
        this.reload(true);
      },
      error: (error: unknown) => {
        this.setError(this.resolveErrorMessage(error));
      },
    });
  }

  public createSample(): void {
    this.setLoading();
    this.addDto(this.createSampleDto()).subscribe({
      next: (result) => {
        this.state.update((current) => ({
          ...current,
          mutationResult: result,
          isLoading: false,
          errorMessage: null,
        }));
        this.reload(true);
      },
      error: (error: unknown) => {
        this.setError(this.resolveErrorMessage(error));
      },
    });
  }

  public updateSample(primaryId?: string, secondaryId?: string): void {
    this.setLoading();
    this.updateDto(this.updateSampleDto(primaryId, secondaryId)).subscribe({
      next: (result) => {
        this.state.update((current) => ({
          ...current,
          mutationResult: result ?? { success: true, operation: 'update' },
          isLoading: false,
          errorMessage: null,
        }));
        this.reload(true);
      },
      error: (error: unknown) => {
        this.setError(this.resolveErrorMessage(error));
      },
    });
  }

  protected asNumberishId(value: string | undefined, fallback: string): number | string {
    const resolved = value && value.trim().length > 0 ? value : fallback;
    const numeric = Number(resolved);
    return Number.isNaN(numeric) ? resolved : numeric;
  }

  protected createFieldsSection(
    title: string,
    fields: ReadonlyArray<{ readonly label: string; readonly value: unknown }>
  ): ResourceDetailSection {
    return {
      title,
      kind: 'fields',
      fields: fields.map((field) => ({
        label: field.label,
        value: this.toDisplayValue(field.value),
      })),
    };
  }

  protected createTableSection(
    title: string,
    columns: readonly string[],
    rows: ReadonlyArray<ReadonlyArray<unknown>>
  ): ResourceDetailSection {
    return {
      title,
      kind: 'table',
      table: {
        columns,
        rows: rows.map((row) => row.map((cell) => this.toDisplayValue(cell))),
      },
    };
  }

  protected toDisplayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private toFieldSection(title: string, value: unknown): readonly ResourceDetailSection[] {
    if (!value || typeof value !== 'object') {
      return [
        this.createFieldsSection(title, [
          {
            label: 'Value',
            value,
          },
        ]),
      ];
    }

    return [
      this.createFieldsSection(
        title,
        Object.entries(value as Record<string, unknown>).map(([label, fieldValue]) => ({
          label,
          value: fieldValue,
        }))
      ),
    ];
  }

  private resolveMutationStatus(payload: Record<string, unknown>): string {
    const success = payload['success'];
    if (typeof success === 'boolean') {
      return success ? 'Success' : 'Failed';
    }

    return 'Success';
  }

  private toSentenceCase(value: string): string {
    if (!value) {
      return value;
    }

    return `${value[0]?.toUpperCase() ?? ''}${value.slice(1).toLowerCase()}`;
  }

  private setLoading(): void {
    this.state.update((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));
  }

  private setError(message: string): void {
    this.state.update((current) => ({
      ...current,
      isLoading: false,
      errorMessage: message,
    }));
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
      return error.apiError.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message?: string }).message ?? 'Request failed.';
    }

    return 'Request failed.';
  }
}
