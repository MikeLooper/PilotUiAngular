import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ResourceDetailSection,
  ResourcePageDefaults,
  ResourcePageEntryState,
  ResourceCrudState,
  ResourceCrudVmFacade,
  ResourceCrudViewModel,
  ResourceOperation,
  ResourceOperationResult,
  ResourceRecord,
} from './resource-vm.models';
import { toResourceErrorMessage } from './resource-error-message';

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
  lastOperation: null,
  isLoading: false,
  errorMessage: null,
};

export abstract class BaseResourceCrudVmFacade<
  TDto extends object,
> implements ResourceCrudVmFacade {
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
      lastOperation: null,
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

  public mapOperationResultSections(
    result: ResourceOperationResult,
  ): readonly ResourceDetailSection[] {
    if (result.errorMessage) {
      return [];
    }

    if (result.operation === 'get') {
      return result.response === null ? [] : this.mapSelectedItemSections(result.response);
    }

    return this.mapMutationResultSections(
      result.response ?? { success: true, operation: result.operation },
    );
  }

  public createSamplePayload(): object {
    return this.createSampleDto();
  }

  public updateSamplePayload(primaryId?: string, secondaryId?: string): object {
    return this.updateSampleDto(primaryId, secondaryId);
  }

  protected mapMutationResultForResource(
    resourceLabel: string,
    idLabel: string,
    value: unknown,
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
        this.setError(toResourceErrorMessage(error));
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
    this.runOperation(
      'get',
      this.toIdRequest(primaryId, secondaryId),
      this.getByIdDto(primaryId, secondaryId),
    );
  }

  public deleteById(primaryId: string, secondaryId?: string): void {
    this.runOperation(
      'delete',
      this.toIdRequest(primaryId, secondaryId),
      this.deleteDto(primaryId, secondaryId),
    );
  }

  public create(payload: object): void {
    this.runOperation('create', payload, this.addDto(payload as TDto));
  }

  public update(payload: object): void {
    this.runOperation('update', payload, this.updateDto(payload as TDto));
  }

  protected asNumberishId(value: string | undefined, fallback: string): number | string {
    const resolved = value && value.trim().length > 0 ? value : fallback;
    const numeric = Number(resolved);
    return Number.isNaN(numeric) ? resolved : numeric;
  }

  protected createFieldsSection(
    title: string,
    fields: ReadonlyArray<{ readonly label: string; readonly value: unknown }>,
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
    rows: ReadonlyArray<ReadonlyArray<unknown>>,
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
        })),
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

  /**
   * Records the outcome of a single-record request in `lastOperation` (failures included, so
   * they show beside the request rather than as a list error) and reloads the list after a
   * successful mutation.
   */
  private runOperation(
    operation: ResourceOperation,
    request: unknown,
    request$: Observable<unknown>,
  ): void {
    this.state.update((current) => ({
      ...current,
      lastOperation: null,
      isLoading: true,
      errorMessage: null,
    }));
    request$.subscribe({
      next: (response) => {
        this.state.update((current) => ({
          ...current,
          lastOperation: { operation, request, response: response ?? null, errorMessage: null },
          isLoading: false,
        }));

        if (operation !== 'get') {
          this.reload(true);
        }
      },
      error: (error: unknown) => {
        this.state.update((current) => ({
          ...current,
          lastOperation: {
            operation,
            request,
            response: null,
            errorMessage: toResourceErrorMessage(error, operation),
          },
          isLoading: false,
        }));
      },
    });
  }

  /** Mirrors the fallback the resource facades apply when an id field is left blank. */
  private toIdRequest(primaryId: string, secondaryId?: string): Record<string, string> {
    const request: Record<string, string> = {
      [this.primaryIdLabel]: primaryId.trim() || this.defaultPrimaryId,
    };

    if (this.secondaryIdLabel) {
      request[this.secondaryIdLabel] = secondaryId?.trim() || this.defaultSecondaryId || '';
    }

    return request;
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
}
