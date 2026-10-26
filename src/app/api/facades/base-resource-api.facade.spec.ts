import { HttpTestingController } from '@angular/common/http/testing';
import { Injectable, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, lastValueFrom, of } from 'rxjs';

import { DataSourceOption } from '../../core/config/data-sources';
import { BaseResourceApiFacade } from './base-resource-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const OTHER_DATA_SOURCE: DataSourceOption = {
  id: 'java-postgresql',
  description: 'Java Spring Boot application with PostgreSQL',
  baseHostname: 'localhost',
  basePort: 11301,
};

/** Minimal concrete facade that exposes the protected cache API the same way real facades do. */
@Injectable({ providedIn: 'root' })
class TestResourceApiFacade extends BaseResourceApiFacade<string> {
  public readonly fetchAllSource = vi.fn<() => Observable<readonly string[]>>(() => of(['a', 'b']));

  public getAll(forceRefresh = false): Observable<readonly string[]> {
    return this.getAllCached(forceRefresh);
  }

  public invalidate(): void {
    this.clearCache();
  }

  protected fetchAll(): Observable<readonly string[]> {
    return this.fetchAllSource();
  }
}

describe('BaseResourceApiFacade', () => {
  let facade: TestResourceApiFacade;
  let httpMock: HttpTestingController;
  let activeDataSource: WritableSignal<DataSourceOption>;

  beforeEach(() => {
    const context = setupFacadeTestbed(TestResourceApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
    activeDataSource = context.activeDataSource;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('getAllCached', () => {
    it('fetches from the source on the first call', async () => {
      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual(['a', 'b']);
      expect(facade.fetchAllSource).toHaveBeenCalledTimes(1);
    });

    it('replays the cached result without fetching again', async () => {
      await lastValueFrom(facade.getAll());

      const result = await lastValueFrom(facade.getAll());

      expect(result).toEqual(['a', 'b']);
      expect(facade.fetchAllSource).toHaveBeenCalledTimes(1);
    });

    it('fetches again when forceRefresh is true', async () => {
      await lastValueFrom(facade.getAll());
      facade.fetchAllSource.mockReturnValue(of(['c']));

      const result = await lastValueFrom(facade.getAll(true));

      expect(result).toEqual(['c']);
      expect(facade.fetchAllSource).toHaveBeenCalledTimes(2);
    });

    it('shares one in-flight fetch between concurrent subscribers', async () => {
      const source = new Subject<readonly string[]>();
      facade.fetchAllSource.mockReturnValue(source);

      const first = lastValueFrom(facade.getAll());
      const second = lastValueFrom(facade.getAll());
      source.next(['shared']);
      source.complete();

      expect(await first).toEqual(['shared']);
      expect(await second).toEqual(['shared']);
      expect(facade.fetchAllSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('causes the next call to fetch from the source again', async () => {
      await lastValueFrom(facade.getAll());

      facade.invalidate();
      await lastValueFrom(facade.getAll());

      expect(facade.fetchAllSource).toHaveBeenCalledTimes(2);
    });
  });

  describe('active data source changes', () => {
    it('keeps the cache while the active data source is unchanged', async () => {
      TestBed.tick();
      await lastValueFrom(facade.getAll());

      TestBed.tick();
      await lastValueFrom(facade.getAll());

      expect(facade.fetchAllSource).toHaveBeenCalledTimes(1);
    });

    it('clears the cache when the active data source changes', async () => {
      TestBed.tick();
      await lastValueFrom(facade.getAll());

      activeDataSource.set(OTHER_DATA_SOURCE);
      TestBed.tick();
      await lastValueFrom(facade.getAll());

      expect(facade.fetchAllSource).toHaveBeenCalledTimes(2);
    });
  });
});
