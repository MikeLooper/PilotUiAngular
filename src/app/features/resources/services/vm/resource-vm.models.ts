import { Signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export type ResourceKey =
  | 'categories'
  | 'customers'
  | 'employees'
  | 'order-details'
  | 'orders'
  | 'products'
  | 'shippers'
  | 'suppliers'
  | 'system';

export interface ResourceRecord {
  readonly primaryId: string;
  readonly secondaryId?: string;
  readonly title: string;
  readonly subtitle: string;
  readonly raw: unknown;
}

export interface ResourceCrudState {
  readonly items: readonly ResourceRecord[];
  readonly searchTerm: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sortDirection: SortDirection;
  readonly selectedItem: unknown | null;
  readonly mutationResult: unknown | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export interface ResourceCrudViewModel extends ResourceCrudState {
  readonly pagedItems: readonly ResourceRecord[];
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasEmptyState: boolean;
}

export interface ResourcePageDefaults {
  readonly initialPrimaryId: string;
  readonly initialSecondaryId?: string;
  readonly initialSearchTerm?: string;
  readonly initialSortDirection?: SortDirection;
  readonly pageSize?: number;
  readonly autoLoadOnEnter?: boolean;
  readonly forceRefreshOnEnter?: boolean;
}

export interface ResourcePageEntryState {
  readonly primaryId: string;
  readonly secondaryId?: string;
}

export interface ResourceDetailField {
  readonly label: string;
  readonly value: string;
}

export interface ResourceDetailTable {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface ResourceDetailSection {
  readonly title: string;
  readonly kind: 'fields' | 'table';
  readonly fields?: readonly ResourceDetailField[];
  readonly table?: ResourceDetailTable;
}

export interface ResourceCrudVmFacade {
  readonly key: Exclude<ResourceKey, 'system'>;
  readonly heading: string;
  readonly description: string;
  readonly primaryIdLabel: string;
  readonly secondaryIdLabel?: string;
  readonly defaultPrimaryId: string;
  readonly defaultSecondaryId?: string;
  readonly pageDefaults: ResourcePageDefaults;
  readonly vm: Signal<ResourceCrudViewModel>;

  onPageEnter(): ResourcePageEntryState;
  mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[];
  mapMutationResultSections(value: unknown): readonly ResourceDetailSection[];
  reload(forceRefresh?: boolean): void;
  setSearchTerm(term: string): void;
  toggleSortDirection(): void;
  goToPage(page: number): void;
  fetchById(primaryId: string, secondaryId?: string): void;
  deleteById(primaryId: string, secondaryId?: string): void;
  createSample(): void;
  updateSample(primaryId?: string, secondaryId?: string): void;
}

export interface SystemVmState {
  readonly isLoading: boolean;
  readonly healthcheckResult: string | null;
  readonly errorMessage: string | null;
}

export interface SystemVmFacade {
  readonly key: 'system';
  readonly heading: string;
  readonly description: string;
  readonly vm: Signal<SystemVmState>;

  runHealthcheck(): void;
}
