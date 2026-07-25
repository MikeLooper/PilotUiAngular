import { JsonPipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { HighlightDirective } from '../../../../shared/directives/highlight';
import { ResourceVmRegistryService } from '../../services/vm/resource-vm-registry.service';
import { ResourceDetailSection, ResourceKey } from '../../services/vm/resource-vm.models';

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

  private readonly activeResourceSignal = toSignal(
    this.route.data.pipe(map((data) => this.normalizeResourceKey(data['resourceKey']))),
    { initialValue: 'categories' }
  );

  protected readonly activeResource = computed(() => this.activeResourceSignal());
  protected readonly activeCrudFacade = computed(() => {
    const key = this.activeResource();
    return this.vmRegistry.getCrudFacade(key);
  });
  protected readonly systemFacade = this.vmRegistry.getSystemFacade();

  protected primaryIdValue = '';
  protected secondaryIdValue = '';

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

  protected onFetchById(): void {
    this.activeCrudFacade()?.fetchById(this.primaryIdValue, this.secondaryIdValue);
  }

  protected onDeleteById(): void {
    this.activeCrudFacade()?.deleteById(this.primaryIdValue, this.secondaryIdValue);
  }

  protected onCreateSample(): void {
    this.activeCrudFacade()?.createSample();
  }

  protected onUpdateSample(): void {
    this.activeCrudFacade()?.updateSample(this.primaryIdValue, this.secondaryIdValue);
  }

  protected onRunHealthcheck(): void {
    this.systemFacade.runHealthcheck();
  }

  protected onRunAbout(): void {
    this.systemFacade.runAbout();
  }

  protected selectedSections(): readonly ResourceDetailSection[] {
    const facade = this.activeCrudFacade();
    const selectedItem = facade?.vm().selectedItem;

    if (!facade || !selectedItem) {
      return [];
    }

    return facade.mapSelectedItemSections(selectedItem);
  }

  protected mutationSections(): readonly ResourceDetailSection[] {
    const facade = this.activeCrudFacade();
    const mutationResult = facade?.vm().mutationResult;

    if (!facade || !mutationResult) {
      return [];
    }

    return facade.mapMutationResultSections(mutationResult);
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
