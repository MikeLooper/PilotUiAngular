import { Observable, Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../../../core/errors/api-error.model';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourcePageDefaults, ResourceRecord } from './resource-vm.models';

interface Gadget {
  readonly id?: number | string;
  readonly name: string;
  readonly note?: string;
}

interface TestMetadata {
  readonly pageDefaults?: ResourcePageDefaults;
}

const GADGETS: readonly Gadget[] = [
  { id: 2, name: 'Bravo', note: 'second' },
  { id: 1, name: 'alpha', note: 'first' },
  { id: 3, name: 'Charlie', note: 'third' },
];

/** Concrete facade over vi.fn() operations, wired the way the real resource VM facades are. */
class TestCrudVmFacade extends BaseResourceCrudVmFacade<Gadget> {
  public readonly key = 'categories' as const;

  public readonly api = {
    loadAll: vi.fn<(forceRefresh: boolean) => Observable<readonly Gadget[]>>(() => of(GADGETS)),
    getById: vi.fn<(id: number | string, secondaryId?: string) => Observable<Gadget>>(() =>
      of(GADGETS[0]!),
    ),
    add: vi.fn<(dto: Gadget) => Observable<unknown>>(() => of({ id: 9 })),
    update: vi.fn<(dto: Gadget) => Observable<unknown>>(() => of(undefined)),
    delete: vi.fn<(id: number | string, secondaryId?: string) => Observable<void>>(() =>
      of(undefined),
    ),
  };

  public constructor(metadata: TestMetadata = {}) {
    super({
      heading: 'Gadgets API',
      description: 'Manage gadgets.',
      primaryIdLabel: 'Gadget ID',
      secondaryIdLabel: 'Batch ID',
      defaultPrimaryId: '1',
      defaultSecondaryId: '100',
      ...metadata,
    });
  }

  protected loadAllDtos(forceRefresh: boolean): Observable<readonly Gadget[]> {
    return this.api.loadAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string, secondaryId?: string): Observable<Gadget> {
    return this.api.getById(this.asNumberishId(primaryId, this.defaultPrimaryId), secondaryId);
  }

  protected createSampleDto(): Gadget {
    return { name: 'Sample gadget' };
  }

  protected updateSampleDto(primaryId?: string): Gadget {
    return { id: this.asNumberishId(primaryId, this.defaultPrimaryId), name: 'Updated gadget' };
  }

  protected addDto(dto: Gadget): Observable<unknown> {
    return this.api.add(dto);
  }

  protected updateDto(dto: Gadget): Observable<unknown> {
    return this.api.update(dto);
  }

  protected deleteDto(primaryId: string, secondaryId?: string): Observable<void> {
    return this.api.delete(this.asNumberishId(primaryId, this.defaultPrimaryId), secondaryId);
  }

  protected mapDtoToRecord(dto: Gadget): ResourceRecord {
    return { primaryId: String(dto.id), title: dto.name, subtitle: dto.note ?? '', raw: dto };
  }
}

/** Uses the shared mutation-status mapping the way the real resource VM facades do. */
class StatusReportingVmFacade extends TestCrudVmFacade {
  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Gadget', 'Gadget ID', value);
  }
}

function manyGadgets(count: number): Gadget[] {
  return [...Array(count).keys()].map((index) => ({
    id: index + 1,
    name: `Gadget ${String(index + 1).padStart(2, '0')}`,
  }));
}

describe('BaseResourceCrudVmFacade', () => {
  let facade: TestCrudVmFacade;

  beforeEach(() => {
    facade = new TestCrudVmFacade();
  });

  describe('metadata', () => {
    it('exposes the heading, description, and id labels', () => {
      const { heading, description, primaryIdLabel, secondaryIdLabel } = facade;

      expect({ heading, description, primaryIdLabel, secondaryIdLabel }).toEqual({
        heading: 'Gadgets API',
        description: 'Manage gadgets.',
        primaryIdLabel: 'Gadget ID',
        secondaryIdLabel: 'Batch ID',
      });
    });

    it('exposes the default ids', () => {
      const { defaultPrimaryId, defaultSecondaryId } = facade;

      expect(defaultPrimaryId).toBe('1');
      expect(defaultSecondaryId).toBe('100');
    });
  });

  describe('pageDefaults', () => {
    it('derives page defaults from the metadata when none are supplied', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toEqual({
        initialPrimaryId: '1',
        initialSecondaryId: '100',
        initialSearchTerm: '',
        initialSortDirection: 'asc',
        pageSize: 8,
        autoLoadOnEnter: true,
        forceRefreshOnEnter: false,
      });
    });

    it('lets supplied page defaults override the derived values', () => {
      const custom = new TestCrudVmFacade({
        pageDefaults: { initialPrimaryId: '5', initialSearchTerm: 'br', pageSize: 2 },
      });

      const pageDefaults = custom.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '5',
        initialSearchTerm: 'br',
        pageSize: 2,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('vm', () => {
    it('starts empty, idle, and on page 1', () => {
      const vm = facade.vm();

      expect(vm).toMatchObject({
        items: [],
        pagedItems: [],
        searchTerm: '',
        page: 1,
        totalItems: 0,
        totalPages: 1,
        sortDirection: 'asc',
        isLoading: false,
        errorMessage: null,
        selectedItem: null,
        mutationResult: null,
      });
    });

    it('sorts items by title ascending, ignoring case', () => {
      facade.reload();

      const titles = facade.vm().pagedItems.map((item) => item.title);

      expect(titles).toEqual(['alpha', 'Bravo', 'Charlie']);
    });

    it.each([
      { label: 'title', term: 'brav', expected: ['Bravo'] },
      { label: 'subtitle', term: 'THIRD', expected: ['Charlie'] },
      { label: 'raw DTO content', term: '"id":1', expected: ['alpha'] },
      { label: 'trimmed term', term: '  charlie  ', expected: ['Charlie'] },
    ])('filters items by $label', ({ term, expected }) => {
      facade.reload();

      facade.setSearchTerm(term);

      expect(facade.vm().pagedItems.map((item) => item.title)).toEqual(expected);
    });

    it('pages the filtered items by the page size', () => {
      facade.api.loadAll.mockReturnValue(of(manyGadgets(10)));
      facade.reload();

      facade.goToPage(2);

      const vm = facade.vm();
      expect(vm.totalItems).toBe(10);
      expect(vm.totalPages).toBe(2);
      expect(vm.pagedItems.map((item) => item.title)).toEqual(['Gadget 09', 'Gadget 10']);
    });

    it('clamps the page to the last available page', () => {
      facade.reload();

      facade.goToPage(5);

      expect(facade.vm().page).toBe(1);
    });

    it('reports an empty state when loading finished without matching items', () => {
      facade.reload();

      facade.setSearchTerm('no such gadget');

      expect(facade.vm().hasEmptyState).toBe(true);
    });

    it('does not report an empty state while loading', () => {
      facade.api.loadAll.mockReturnValue(new Subject<readonly Gadget[]>());

      facade.reload();

      expect(facade.vm().hasEmptyState).toBe(false);
    });

    it('does not report an empty state when loading failed', () => {
      facade.api.loadAll.mockReturnValue(throwError(() => new Error('down')));

      facade.reload();

      expect(facade.vm().hasEmptyState).toBe(false);
    });
  });

  describe('onPageEnter', () => {
    it('returns the initial ids for the page inputs', () => {
      const entryState = facade.onPageEnter();

      expect(entryState).toEqual({ primaryId: '1', secondaryId: '100' });
    });

    it('applies the page defaults and clears previous results', () => {
      const custom = new TestCrudVmFacade({
        pageDefaults: {
          initialPrimaryId: '1',
          initialSearchTerm: 'a',
          initialSortDirection: 'desc',
          pageSize: 2,
          autoLoadOnEnter: false,
        },
      });
      custom.fetchById('1');
      custom.createSample();
      custom.goToPage(3);

      custom.onPageEnter();

      expect(custom.vm()).toMatchObject({
        searchTerm: 'a',
        sortDirection: 'desc',
        pageSize: 2,
        page: 1,
        selectedItem: null,
        mutationResult: null,
        errorMessage: null,
      });
    });

    it('loads the list without forcing a refresh by default', () => {
      facade.onPageEnter();

      expect(facade.api.loadAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('forces a refresh when forceRefreshOnEnter is set', () => {
      const custom = new TestCrudVmFacade({
        pageDefaults: { initialPrimaryId: '1', forceRefreshOnEnter: true },
      });

      custom.onPageEnter();

      expect(custom.api.loadAll).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('does not load the list when autoLoadOnEnter is false', () => {
      const custom = new TestCrudVmFacade({
        pageDefaults: { initialPrimaryId: '1', autoLoadOnEnter: false },
      });

      custom.onPageEnter();

      expect(custom.api.loadAll).not.toHaveBeenCalled();
    });
  });

  describe('reload', () => {
    it('forces a refresh by default', () => {
      facade.reload();

      expect(facade.api.loadAll).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('passes forceRefresh through when given', () => {
      facade.reload(false);

      expect(facade.api.loadAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps the loaded DTOs into records', () => {
      facade.reload();

      expect(facade.vm().items).toContainEqual({
        primaryId: '2',
        title: 'Bravo',
        subtitle: 'second',
        raw: GADGETS[0],
      });
    });

    it('marks the view model as loading while the request is pending', () => {
      facade.api.loadAll.mockReturnValue(new Subject<readonly Gadget[]>());

      facade.reload();

      expect(facade.vm().isLoading).toBe(true);
    });

    it('clears the loading flag and error after loading', () => {
      facade.reload();

      expect(facade.vm()).toMatchObject({ isLoading: false, errorMessage: null });
    });

    it.each([
      {
        label: 'an ApiClientError',
        error: new ApiClientError({ kind: 'network', status: 0, message: 'API unreachable' }),
        expected: 'API unreachable',
      },
      { label: 'an error with a message', error: new Error('Boom'), expected: 'Boom' },
      {
        label: 'an error with an undefined message',
        error: { message: undefined },
        expected: 'Request failed.',
      },
      { label: 'a non-object error', error: 'boom', expected: 'Request failed.' },
    ])('shows the message of $label', ({ error, expected }) => {
      facade.api.loadAll.mockReturnValue(throwError(() => error));

      facade.reload();

      expect(facade.vm()).toMatchObject({ isLoading: false, errorMessage: expected });
    });
  });

  describe('setSearchTerm', () => {
    it('stores the term and returns to page 1', () => {
      facade.api.loadAll.mockReturnValue(of(manyGadgets(10)));
      facade.reload();
      facade.goToPage(2);

      facade.setSearchTerm('Gadget');

      expect(facade.vm()).toMatchObject({ searchTerm: 'Gadget', page: 1 });
    });
  });

  describe('toggleSortDirection', () => {
    it('switches between ascending and descending order', () => {
      facade.reload();

      facade.toggleSortDirection();
      const afterFirstToggle = facade.vm().pagedItems.map((item) => item.title);
      facade.toggleSortDirection();

      expect(afterFirstToggle).toEqual(['Charlie', 'Bravo', 'alpha']);
      expect(facade.vm().sortDirection).toBe('asc');
    });

    it('returns to page 1', () => {
      facade.api.loadAll.mockReturnValue(of(manyGadgets(10)));
      facade.reload();
      facade.goToPage(2);

      facade.toggleSortDirection();

      expect(facade.vm().page).toBe(1);
    });
  });

  describe('goToPage', () => {
    it.each([0, -3])('treats page %i as page 1', (page) => {
      facade.api.loadAll.mockReturnValue(of(manyGadgets(10)));
      facade.reload();

      facade.goToPage(page);

      expect(facade.vm().page).toBe(1);
    });
  });

  describe('fetchById', () => {
    it('stores the fetched DTO as the selected item', () => {
      facade.fetchById('2', '100');

      expect(facade.api.getById).toHaveBeenCalledExactlyOnceWith(2, '100');
      expect(facade.vm()).toMatchObject({ selectedItem: GADGETS[0], isLoading: false });
    });

    it.each([
      { label: 'a numeric id as a number', input: '42', expected: 42 },
      { label: 'a non-numeric id as a string', input: 'ALFKI', expected: 'ALFKI' },
      { label: 'the default id for an empty id', input: '', expected: 1 },
      { label: 'the default id for a whitespace id', input: '   ', expected: 1 },
    ])('passes $label', ({ input, expected }) => {
      facade.fetchById(input);

      expect(facade.api.getById).toHaveBeenCalledExactlyOnceWith(expected, undefined);
    });

    it('shows the error message when the request fails', () => {
      facade.api.getById.mockReturnValue(throwError(() => new Error('Not found')));

      facade.fetchById('2');

      expect(facade.vm()).toMatchObject({ isLoading: false, errorMessage: 'Not found' });
    });
  });

  describe('deleteById', () => {
    it('records a delete result and reloads the list', () => {
      facade.deleteById('2', '100');

      expect(facade.api.delete).toHaveBeenCalledExactlyOnceWith(2, '100');
      expect(facade.vm().mutationResult).toEqual({ success: true, operation: 'delete' });
      expect(facade.api.loadAll).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('shows the error message and does not reload when the request fails', () => {
      facade.api.delete.mockReturnValue(throwError(() => new Error('Conflict')));

      facade.deleteById('2');

      expect(facade.vm().errorMessage).toBe('Conflict');
      expect(facade.api.loadAll).not.toHaveBeenCalled();
    });
  });

  describe('createSample', () => {
    it('adds the sample DTO, records the response, and reloads the list', () => {
      facade.createSample();

      expect(facade.api.add).toHaveBeenCalledExactlyOnceWith({ name: 'Sample gadget' });
      expect(facade.vm().mutationResult).toEqual({ id: 9 });
      expect(facade.api.loadAll).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('shows the error message and does not reload when the request fails', () => {
      facade.api.add.mockReturnValue(throwError(() => new Error('Invalid')));

      facade.createSample();

      expect(facade.vm().errorMessage).toBe('Invalid');
      expect(facade.api.loadAll).not.toHaveBeenCalled();
    });
  });

  describe('updateSample', () => {
    it('updates the sample DTO for the given id and reloads the list', () => {
      facade.updateSample('3');

      expect(facade.api.update).toHaveBeenCalledExactlyOnceWith({ id: 3, name: 'Updated gadget' });
      expect(facade.api.loadAll).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('uses the default id when no id is given', () => {
      facade.updateSample();

      expect(facade.api.update).toHaveBeenCalledExactlyOnceWith({ id: 1, name: 'Updated gadget' });
    });

    it('records a generic update result when the response is empty', () => {
      facade.updateSample('3');

      expect(facade.vm().mutationResult).toEqual({ success: true, operation: 'update' });
    });

    it('records the response when the API returns one', () => {
      facade.api.update.mockReturnValue(of({ success: false }));

      facade.updateSample('3');

      expect(facade.vm().mutationResult).toEqual({ success: false });
    });

    it('shows the error message and does not reload when the request fails', () => {
      facade.api.update.mockReturnValue(throwError(() => new Error('Gone')));

      facade.updateSample('3');

      expect(facade.vm().errorMessage).toBe('Gone');
      expect(facade.api.loadAll).not.toHaveBeenCalled();
    });
  });

  describe('mapSelectedItemSections', () => {
    it('lists each property of an object as a display field', () => {
      const value = { id: 7, active: true, tags: ['a'], note: null, empty: '', missing: undefined };

      const sections = facade.mapSelectedItemSections(value);

      expect(sections).toEqual([
        {
          title: 'Selected record',
          kind: 'fields',
          fields: [
            { label: 'id', value: '7' },
            { label: 'active', value: 'true' },
            { label: 'tags', value: '["a"]' },
            { label: 'note', value: '-' },
            { label: 'empty', value: '-' },
            { label: 'missing', value: '-' },
          ],
        },
      ]);
    });

    it.each([
      { label: 'a string', value: 'Healthy', expected: 'Healthy' },
      { label: 'a number', value: 0, expected: '0' },
      { label: 'null', value: null, expected: '-' },
    ])('shows $label as a single Value field', ({ value, expected }) => {
      const sections = facade.mapSelectedItemSections(value);

      expect(sections).toEqual([
        { title: 'Selected record', kind: 'fields', fields: [{ label: 'Value', value: expected }] },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('lists each property of the mutation result as a display field', () => {
      const sections = facade.mapMutationResultSections({ id: 9 });

      expect(sections).toEqual([
        { title: 'Last mutation result', kind: 'fields', fields: [{ label: 'id', value: '9' }] },
      ]);
    });
  });

  describe('mapMutationResultForResource', () => {
    let statusFacade: StatusReportingVmFacade;

    beforeEach(() => {
      statusFacade = new StatusReportingVmFacade();
    });

    function fieldValues(value: unknown): Record<string, string> {
      const [section] = statusFacade.mapMutationResultSections(value);
      return Object.fromEntries((section?.fields ?? []).map((field) => [field.label, field.value]));
    }

    it('titles the section after the resource', () => {
      const [section] = statusFacade.mapMutationResultSections({ id: 9 });

      expect(section?.title).toBe('Gadget status');
    });

    it.each([
      {
        label: 'the operation in sentence case',
        value: { operation: 'DELETE' },
        expected: 'Delete',
      },
      { label: 'Create when an id is present', value: { id: 9 }, expected: 'Create' },
      { label: 'Update when there is no id', value: { success: true }, expected: 'Update' },
      {
        label: 'the id rule for a blank operation',
        value: { operation: ' ', id: 9 },
        expected: 'Create',
      },
    ])('reports $label as the action', ({ value, expected }) => {
      const fields = fieldValues(value);

      expect(fields['Action']).toBe(expected);
    });

    it.each([
      { label: 'Success when success is true', value: { success: true }, expected: 'Success' },
      { label: 'Failed when success is false', value: { success: false }, expected: 'Failed' },
      {
        label: 'Success when success is not a boolean',
        value: { success: 'yes' },
        expected: 'Success',
      },
    ])('reports $label', ({ value, expected }) => {
      const fields = fieldValues(value);

      expect(fields['Status']).toBe(expected);
    });

    it.each([
      { label: 'id', value: { id: 9, entityId: 8, key: 7 }, expected: '9' },
      { label: 'entityId', value: { entityId: 8, key: 7 }, expected: '8' },
      { label: 'key', value: { key: 7 }, expected: '7' },
      { label: 'nothing', value: {}, expected: '-' },
    ])('takes the id from $label', ({ value, expected }) => {
      const fields = fieldValues(value);

      expect(fields['Gadget ID']).toBe(expected);
    });

    it('treats a non-object result as a successful update without an id', () => {
      const fields = fieldValues('done');

      expect(fields).toEqual({ Action: 'Update', Status: 'Success', 'Gadget ID': '-' });
    });
  });
});
