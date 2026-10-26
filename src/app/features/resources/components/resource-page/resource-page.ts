import { JsonPipe } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { HighlightDirective } from '../../../../shared/directives/highlight';
import { ResourceVmRegistryService } from '../../services/vm/resource-vm-registry.service';
import {
  ResourceCrudVmFacade,
  ResourceDetailSection,
  ResourceKey,
  ResourceOperation,
  ResourceOperationResult,
  ResourcePageMode,
} from '../../services/vm/resource-vm.models';

const resourceKeys: readonly ResourceKey[] = [
  'categories',
  'customers',
  'employees',
  'order-details',
  'orders',
  'products',
  'shippers',
  'suppliers',
  'system',
] as const;

const operationLabels: Readonly<Record<ResourceOperation, string>> = {
  get: 'Get By Id',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

@Component({
  selector: 'app-resource-page',
  imports: [
    FormsModule,
    JsonPipe,
    ButtonComponent,
    HighlightDirective,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './resource-page.html',
  styleUrl: './resource-page.scss',
})
export class ResourcePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly vmRegistry = inject(ResourceVmRegistryService);

  protected readonly links = [
    { label: 'Categories', path: '/resources/categories', key: 'categories' },
    { label: 'Customers', path: '/resources/customers', key: 'customers' },
    { label: 'Employees', path: '/resources/employees', key: 'employees' },
    { label: 'Order Details', path: '/resources/order-details', key: 'order-details' },
    { label: 'Orders', path: '/resources/orders', key: 'orders' },
    { label: 'Products', path: '/resources/products', key: 'products' },
    { label: 'Shippers', path: '/resources/shippers', key: 'shippers' },
    { label: 'Suppliers', path: '/resources/suppliers', key: 'suppliers' },
    { label: 'System', path: '/resources/system', key: 'system' },
  ] as const;

  protected readonly operations = [
    { value: 'load-all', label: 'Load All' },
    { value: 'get', label: 'Get' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
  ] as const satisfies ReadonlyArray<{ value: ResourcePageMode; label: string }>;
  protected readonly operationLabels = operationLabels;

  private readonly activeResourceSignal = toSignal(
    this.route.data.pipe(map((data) => this.normalizeResourceKey(data['resourceKey']))),
    { initialValue: 'categories' },
  );

  protected readonly activeResource = computed(() => this.activeResourceSignal());
  protected readonly activeCrudFacade = computed(() => {
    const key = this.activeResource();
    return this.vmRegistry.getCrudFacade(key);
  });
  protected readonly systemFacade = this.vmRegistry.getSystemFacade();

  protected primaryIdValue = '';
  protected secondaryIdValue = '';

  /** Starts on Load All whenever a resource page is opened (the facade loads the list on entry). */
  protected readonly operation = linkedSignal<ResourceCrudVmFacade | null, ResourcePageMode>({
    source: () => this.activeCrudFacade(),
    computation: () => 'load-all',
  });
  protected readonly payloadError = signal<string | null>(null);

  private readonly lastOperation = computed(
    () => this.activeCrudFacade()?.vm().lastOperation ?? null,
  );

  /**
   * The last result, shown only under the bubble that produced it. Update also shows Get results,
   * since its Load Record action fetches the record to edit.
   */
  protected readonly visibleResult = computed<ResourceOperationResult | null>(() => {
    const result = this.lastOperation();
    const mode = this.operation();

    if (!result || mode === 'load-all') {
      return null;
    }

    return result.operation === mode || (mode === 'update' && result.operation === 'get')
      ? result
      : null;
  });

  private readonly fetchedRecord = computed(() => {
    const result = this.lastOperation();
    return result?.operation === 'get' && result.response !== null ? result.response : null;
  });

  protected readonly createPayloadText = linkedSignal(() =>
    this.toJson(this.activeCrudFacade()?.createSamplePayload() ?? {}),
  );

  /**
   * Starts from the resource's update sample and is replaced by each record fetched with
   * Get By Id, so a record can be loaded, edited, and sent back. Clearing the last result
   * (a new request starting) keeps the current text.
   */
  protected readonly updatePayloadText = linkedSignal<
    { readonly facade: ResourceCrudVmFacade | null; readonly record: unknown },
    string
  >({
    source: () => ({ facade: this.activeCrudFacade(), record: this.fetchedRecord() }),
    computation: (source, previous) => {
      if (source.record !== null) {
        return this.toJson(source.record);
      }

      if (previous && previous.source.facade === source.facade) {
        return previous.value;
      }

      return this.toJson(source.facade?.updateSamplePayload() ?? {});
    },
  });

  protected readonly operationSections = computed<readonly ResourceDetailSection[]>(() => {
    const facade = this.activeCrudFacade();
    const result = this.visibleResult();

    return facade && result ? facade.mapOperationResultSections(result) : [];
  });

  protected readonly operationStatus = computed(() => {
    const result = this.visibleResult();

    if (!result) {
      return '';
    }

    if (result.errorMessage) {
      return 'Failed';
    }

    if (result.response === null) {
      return result.operation === 'get' ? 'No record found' : 'Succeeded (no content returned)';
    }

    return 'Succeeded';
  });

  protected readonly heading = computed(() => {
    const crudFacade = this.activeCrudFacade();
    if (crudFacade) {
      return crudFacade.heading;
    }

    return this.systemFacade.heading;
  });

  protected readonly description = computed(() => {
    const crudFacade = this.activeCrudFacade();
    if (crudFacade) {
      return crudFacade.description;
    }

    return this.systemFacade.description;
  });

  public constructor() {
    effect(() => {
      const crudFacade = this.activeCrudFacade();

      if (crudFacade) {
        const entryState = crudFacade.onPageEnter();
        this.primaryIdValue = entryState.primaryId;
        this.secondaryIdValue = entryState.secondaryId ?? '';
        return;
      }

      this.primaryIdValue = '';
      this.secondaryIdValue = '';
    });
  }

  protected onSearchTermChanged(term: string): void {
    this.activeCrudFacade()?.setSearchTerm(term);
  }

  protected onToggleSortDirection(): void {
    this.activeCrudFacade()?.toggleSortDirection();
  }

  protected onReload(): void {
    this.activeCrudFacade()?.reload(true);
  }

  protected onPageChanged(page: number): void {
    this.activeCrudFacade()?.goToPage(page);
  }

  protected onOperationChanged(mode: ResourcePageMode): void {
    this.operation.set(mode);
    this.payloadError.set(null);

    if (mode === 'load-all') {
      this.onReload();
    }
  }

  /** Clicking Load All while it is already selected fires no change event, so reload here. */
  protected onOperationClicked(mode: ResourcePageMode): void {
    const isLoading = this.activeCrudFacade()?.vm().isLoading ?? false;

    if (mode === 'load-all' && this.operation() === 'load-all' && !isLoading) {
      this.onReload();
    }
  }

  protected onFetchById(): void {
    this.activeCrudFacade()?.fetchById(this.primaryIdValue, this.secondaryIdValue);
  }

  protected onDeleteById(): void {
    this.activeCrudFacade()?.deleteById(this.primaryIdValue, this.secondaryIdValue);
  }

  protected onCreatePayloadChanged(text: string): void {
    this.createPayloadText.set(text);
    this.payloadError.set(null);
  }

  protected onUpdatePayloadChanged(text: string): void {
    this.updatePayloadText.set(text);
    this.payloadError.set(null);
  }

  protected onLoadCreateSample(): void {
    this.onCreatePayloadChanged(this.toJson(this.activeCrudFacade()?.createSamplePayload() ?? {}));
  }

  protected onLoadUpdateSample(): void {
    const sample = this.activeCrudFacade()?.updateSamplePayload(
      this.primaryIdValue,
      this.secondaryIdValue,
    );
    this.onUpdatePayloadChanged(this.toJson(sample ?? {}));
  }

  protected onCreate(): void {
    const payload = this.parsePayload(this.createPayloadText());
    if (payload) {
      this.activeCrudFacade()?.create(payload);
    }
  }

  protected onUpdate(): void {
    const payload = this.parsePayload(this.updatePayloadText());
    if (payload) {
      this.activeCrudFacade()?.update(payload);
    }
  }

  protected onRunHealthcheck(): void {
    this.systemFacade.runHealthcheck();
  }

  protected onRunAbout(): void {
    this.systemFacade.runAbout();
  }

  private parsePayload(text: string): object | null {
    let value: unknown;

    try {
      value = JSON.parse(text);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Unexpected input.';
      this.payloadError.set(`The request body is not valid JSON: ${reason}`);
      return null;
    }

    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      this.payloadError.set('The request body must be a JSON object.');
      return null;
    }

    this.payloadError.set(null);
    return value;
  }

  private toJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  private normalizeResourceKey(value: unknown): ResourceKey {
    if (typeof value !== 'string') {
      return 'categories';
    }

    if (resourceKeys.includes(value as ResourceKey)) {
      return value as ResourceKey;
    }

    return 'categories';
  }
}
