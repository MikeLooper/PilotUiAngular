import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { SystemApiFacade } from '../../../api/facades/system-api.facade';
import { AboutResponse } from '../../../api/generated';
import { ApiClientError } from '../../../core/errors/api-error.model';
import { HomeFacade } from './home';

const ABOUT: AboutResponse = { apiVersion: '1.1.2', deployDate: '2026-07-24' };

describe('HomeFacade', () => {
  let getHealthcheck: Mock<() => Observable<string>>;
  let getAbout: Mock<(showDetails?: boolean) => Observable<AboutResponse>>;

  function createFacade(): HomeFacade {
    return TestBed.inject(HomeFacade);
  }

  beforeEach(() => {
    getHealthcheck = vi.fn(() => of('Healthy'));
    getAbout = vi.fn(() => of(ABOUT));
    const systemApiDouble: Partial<SystemApiFacade> = { getHealthcheck, getAbout };
    TestBed.configureTestingModule({
      providers: [{ provide: SystemApiFacade, useValue: systemApiDouble }],
    });
  });

  it('creates the facade', () => {
    const facade = createFacade();

    expect(facade).toBeTruthy();
  });

  describe('constructor', () => {
    it('loads the healthcheck and detailed about information immediately', () => {
      createFacade();

      expect(getHealthcheck).toHaveBeenCalledTimes(1);
      expect(getAbout).toHaveBeenCalledExactlyOnceWith(true);
    });
  });

  describe('vm', () => {
    it('shows placeholder values and a loading flag while the status is pending', () => {
      getHealthcheck.mockReturnValue(new Subject<string>());

      const facade = createFacade();

      expect(facade.vm()).toEqual({
        connectionToApi: 'Loading...',
        apiVersion: 'Loading...',
        apiDeployed: 'Loading...',
        isLoading: true,
        errorMessage: null,
      });
    });

    it('exposes the loaded connection status, version, and deploy date', () => {
      const facade = createFacade();

      const vm = facade.vm();

      expect(vm).toEqual({
        connectionToApi: 'Healthy',
        apiVersion: '1.1.2',
        apiDeployed: '2026-07-24',
        isLoading: false,
        errorMessage: null,
      });
    });

    it('trims whitespace around the version and deploy date', () => {
      getAbout.mockReturnValue(of({ apiVersion: ' 2.0 ', deployDate: ' 2026-08-01 ' }));

      const facade = createFacade();

      expect(facade.vm().apiVersion).toBe('2.0');
      expect(facade.vm().apiDeployed).toBe('2026-08-01');
    });

    it.each([
      { label: 'missing', about: {} },
      { label: 'null', about: { apiVersion: null, deployDate: null } },
      { label: 'blank', about: { apiVersion: '  ', deployDate: '' } },
    ])('shows Unknown when the version and deploy date are $label', ({ about }) => {
      getAbout.mockReturnValue(of(about));

      const facade = createFacade();

      expect(facade.vm().apiVersion).toBe('Unknown');
      expect(facade.vm().apiDeployed).toBe('Unknown');
    });

    it('shows the API error message and Unavailable values when a request fails with an ApiClientError', () => {
      getHealthcheck.mockReturnValue(
        throwError(
          () =>
            new ApiClientError({ kind: 'network', status: 0, message: 'The API is unreachable.' }),
        ),
      );

      const facade = createFacade();

      expect(facade.vm()).toEqual({
        connectionToApi: 'Unavailable',
        apiVersion: 'Unavailable',
        apiDeployed: 'Unavailable',
        isLoading: false,
        errorMessage: 'The API is unreachable.',
      });
    });

    it('shows a generic error message when a request fails with any other error', () => {
      getAbout.mockReturnValue(throwError(() => new Error('boom')));

      const facade = createFacade();

      expect(facade.vm().errorMessage).toBe('Failed to load API status.');
      expect(facade.vm().connectionToApi).toBe('Unavailable');
    });
  });

  describe('reload', () => {
    it('requests the status again', () => {
      const facade = createFacade();

      facade.reload();

      expect(getHealthcheck).toHaveBeenCalledTimes(2);
      expect(getAbout).toHaveBeenCalledTimes(2);
    });

    it('clears a previous error and marks the status as loading while the retry is pending', () => {
      getHealthcheck.mockReturnValue(throwError(() => new Error('boom')));
      const facade = createFacade();
      getHealthcheck.mockReturnValue(new Subject<string>());

      facade.reload();

      expect(facade.vm().errorMessage).toBeNull();
      expect(facade.vm().isLoading).toBe(true);
    });

    it('replaces Unavailable values with fresh data after a successful retry', () => {
      getHealthcheck.mockReturnValue(throwError(() => new Error('boom')));
      const facade = createFacade();
      getHealthcheck.mockReturnValue(of('Healthy'));

      facade.reload();

      expect(facade.vm().connectionToApi).toBe('Healthy');
      expect(facade.vm().errorMessage).toBeNull();
    });
  });
});
