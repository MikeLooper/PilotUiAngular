import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { SystemApiFacade } from '../../../../api/facades/system-api.facade';
import { AboutResponse } from '../../../../api/generated';
import { SystemResourceVmFacade } from './system-resource-vm.facade';

const ABOUT: AboutResponse = { name: 'PilotApiDotNet', apiVersion: '1.1.2' };

describe('SystemResourceVmFacade', () => {
  let facade: SystemResourceVmFacade;
  let getHealthcheck: Mock<() => Observable<string>>;
  let getAbout: Mock<(showDetails?: boolean) => Observable<AboutResponse>>;

  beforeEach(() => {
    getHealthcheck = vi.fn(() => of('Healthy'));
    getAbout = vi.fn(() => of(ABOUT));
    const systemApiDouble: Partial<SystemApiFacade> = { getHealthcheck, getAbout };
    TestBed.configureTestingModule({
      providers: [{ provide: SystemApiFacade, useValue: systemApiDouble }],
    });
    facade = TestBed.inject(SystemResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the system resource', () => {
      expect(facade.key).toBe('system');
    });
  });

  describe('heading', () => {
    it('names the System API page', () => {
      expect(facade.heading).toBe('System API');
    });
  });

  describe('description', () => {
    it('describes the health check page', () => {
      expect(facade.description).toBe('Run backend health checks from a dedicated page.');
    });
  });

  describe('vm', () => {
    it('starts idle with no results', () => {
      const vm = facade.vm();

      expect(vm).toEqual({
        isLoading: false,
        healthcheckResult: null,
        aboutResult: null,
        errorMessage: null,
      });
    });
  });

  describe('runHealthcheck', () => {
    it('stores the healthcheck result', () => {
      facade.runHealthcheck();

      expect(facade.vm()).toMatchObject({
        isLoading: false,
        healthcheckResult: 'Healthy',
        errorMessage: null,
      });
    });

    it('marks the view model as loading while the request is pending', () => {
      getHealthcheck.mockReturnValue(new Subject<string>());

      facade.runHealthcheck();

      expect(facade.vm().isLoading).toBe(true);
    });

    it('shows the error message when the request fails', () => {
      getHealthcheck.mockReturnValue(throwError(() => new Error('Service unavailable')));

      facade.runHealthcheck();

      expect(facade.vm()).toMatchObject({ isLoading: false, errorMessage: 'Service unavailable' });
    });

    it.each([
      { label: 'a non-object error', error: 'boom' },
      { label: 'an object without a message', error: { status: 503 } },
    ])('shows a generic error message for $label', ({ error }) => {
      getHealthcheck.mockReturnValue(throwError(() => error));

      facade.runHealthcheck();

      expect(facade.vm().errorMessage).toBe('Request failed.');
    });

    it('clears a previous error when a new request starts', () => {
      getHealthcheck.mockReturnValueOnce(throwError(() => new Error('down')));
      facade.runHealthcheck();
      getHealthcheck.mockReturnValue(new Subject<string>());

      facade.runHealthcheck();

      expect(facade.vm().errorMessage).toBeNull();
    });

    it('keeps an earlier about result', () => {
      facade.runAbout();

      facade.runHealthcheck();

      expect(facade.vm().aboutResult).toEqual(ABOUT);
    });
  });

  describe('runAbout', () => {
    it('requests detailed about information and stores it', () => {
      facade.runAbout();

      expect(getAbout).toHaveBeenCalledExactlyOnceWith(true);
      expect(facade.vm()).toMatchObject({
        isLoading: false,
        aboutResult: ABOUT,
        errorMessage: null,
      });
    });

    it('marks the view model as loading while the request is pending', () => {
      getAbout.mockReturnValue(new Subject<AboutResponse>());

      facade.runAbout();

      expect(facade.vm().isLoading).toBe(true);
    });

    it('shows the error message when the request fails', () => {
      getAbout.mockReturnValue(throwError(() => new Error('Forbidden')));

      facade.runAbout();

      expect(facade.vm()).toMatchObject({ isLoading: false, errorMessage: 'Forbidden' });
    });

    it('shows a generic error message for a non-object error', () => {
      getAbout.mockReturnValue(throwError(() => 42));

      facade.runAbout();

      expect(facade.vm().errorMessage).toBe('Request failed.');
    });
  });
});
