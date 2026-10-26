import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { CrudResourceStateService } from './crud-resource-state.service';
import { initialResourcePanelState } from './resource-panel-state';

interface Widget {
  readonly id: number;
  readonly name: string;
}

type Id = number | string;

const WIDGET: Widget = { id: 1, name: 'Sprocket' };

describe('CrudResourceStateService', () => {
  let service: CrudResourceStateService<Widget>;
  let loadAll: Mock<() => Observable<readonly Widget[]>>;
  let getById: Mock<(id: Id, secondId?: Id) => Observable<Widget>>;
  let add: Mock<(dto: Widget) => Observable<unknown>>;
  let update: Mock<(dto: Widget) => Observable<unknown>>;
  let remove: Mock<(id: Id, secondId?: Id) => Observable<unknown>>;

  beforeEach(() => {
    loadAll = vi.fn(() => of([WIDGET]));
    getById = vi.fn(() => of(WIDGET));
    add = vi.fn(() => of({ id: 2 }));
    update = vi.fn(() => of(undefined));
    remove = vi.fn(() => of(undefined));
    service = new CrudResourceStateService<Widget>('Widgets', {
      loadAll,
      getById,
      add,
      update,
      delete: remove,
    });
  });

  describe('state', () => {
    it('starts with the initial panel state', () => {
      const state = service.state();

      expect(state).toEqual(initialResourcePanelState);
    });
  });

  describe('loadAll', () => {
    it('stores the loaded items as the list result', () => {
      service.loadAll();

      expect(service.state()).toMatchObject({ listResult: [WIDGET], loading: false, error: null });
    });

    it('marks the state as loading while the request is pending', () => {
      loadAll.mockReturnValue(new Subject<readonly Widget[]>());

      service.loadAll();

      expect(service.state().loading).toBe(true);
    });

    it('stores the error message when the request fails', () => {
      loadAll.mockReturnValue(throwError(() => new Error('List failed')));

      service.loadAll();

      expect(service.state()).toMatchObject({ loading: false, error: 'List failed' });
    });

    it('clears a previous error when a new request starts', () => {
      loadAll.mockReturnValueOnce(throwError(() => new Error('List failed')));
      service.loadAll();
      loadAll.mockReturnValue(new Subject<readonly Widget[]>());

      service.loadAll();

      expect(service.state().error).toBeNull();
    });
  });

  describe('getById', () => {
    it('stores the loaded item as the item result', () => {
      service.getById('1');

      expect(service.state()).toMatchObject({ itemResult: WIDGET, loading: false, error: null });
    });

    it('passes numeric ids as numbers and other ids as strings', () => {
      service.getById('42', 'ALFKI');

      expect(getById).toHaveBeenCalledExactlyOnceWith(42, 'ALFKI');
    });

    it('omits an empty secondary id', () => {
      service.getById('ALFKI', '');

      expect(getById).toHaveBeenCalledExactlyOnceWith('ALFKI', undefined);
    });

    it('stores the error message when the request fails', () => {
      getById.mockReturnValue(throwError(() => new Error('Not found')));

      service.getById('1');

      expect(service.state()).toMatchObject({ loading: false, error: 'Not found' });
    });
  });

  describe('addFromJson', () => {
    it('adds the parsed payload and stores the response as the mutation result', () => {
      service.addFromJson('{"id": 2, "name": "Gear"}');

      expect(add).toHaveBeenCalledExactlyOnceWith({ id: 2, name: 'Gear' });
      expect(service.state()).toMatchObject({ mutationResult: { id: 2 }, loading: false });
    });

    it('records a generic success when the response is empty', () => {
      add.mockReturnValue(of(null));

      service.addFromJson('{"id": 2, "name": "Gear"}');

      expect(service.state().mutationResult).toEqual({ success: true });
    });

    it('reports invalid JSON without calling the API', () => {
      service.addFromJson('{ not json');

      expect(add).not.toHaveBeenCalled();
      expect(service.state()).toMatchObject({
        loading: false,
        error: 'Invalid Widgets payload JSON.',
      });
    });

    it('reports a JSON null payload as invalid', () => {
      service.addFromJson('null');

      expect(add).not.toHaveBeenCalled();
      expect(service.state().error).toBe('Invalid Widgets payload JSON.');
    });

    it('stores the error message when the request fails', () => {
      add.mockReturnValue(throwError(() => new Error('Conflict')));

      service.addFromJson('{"id": 2, "name": "Gear"}');

      expect(service.state()).toMatchObject({ loading: false, error: 'Conflict' });
    });
  });

  describe('updateFromJson', () => {
    it('updates with the parsed payload and records a generic success for an empty response', () => {
      service.updateFromJson('{"id": 1, "name": "Renamed"}');

      expect(update).toHaveBeenCalledExactlyOnceWith({ id: 1, name: 'Renamed' });
      expect(service.state().mutationResult).toEqual({ success: true });
    });

    it('reports invalid JSON without calling the API', () => {
      service.updateFromJson('');

      expect(update).not.toHaveBeenCalled();
      expect(service.state().error).toBe('Invalid Widgets payload JSON.');
    });

    it('stores the error message when the request fails', () => {
      update.mockReturnValue(throwError(() => new Error('Rejected')));

      service.updateFromJson('{"id": 1, "name": "Renamed"}');

      expect(service.state().error).toBe('Rejected');
    });
  });

  describe('deleteById', () => {
    it('deletes by parsed id and records a generic success', () => {
      service.deleteById('7', '10248');

      expect(remove).toHaveBeenCalledExactlyOnceWith(7, 10248);
      expect(service.state().mutationResult).toEqual({ success: true });
    });

    it('omits a missing secondary id', () => {
      service.deleteById('ALFKI');

      expect(remove).toHaveBeenCalledExactlyOnceWith('ALFKI', undefined);
    });

    it.each([
      { label: 'an error without a message', error: { message: '' }, expected: 'Request failed' },
      { label: 'a non-object error', error: 'boom', expected: 'Request failed' },
      { label: 'an object without a message', error: { code: 500 }, expected: 'Request failed' },
    ])('falls back to a generic message for $label', ({ error, expected }) => {
      remove.mockReturnValue(throwError(() => error));

      service.deleteById('7');

      expect(service.state().error).toBe(expected);
    });
  });
});
