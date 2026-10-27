import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { SystemApiFacade } from '../../../api/facades/system-api.facade';
import { AboutResponse } from '../../../api/generated';
import { initialResourcePanelState } from './resource-panel-state';
import { SystemResourceService } from './system-resource.service';

const ABOUT: AboutResponse = { name: 'PilotApiDotNet', apiVersion: '1.1.2' };

describe('SystemResourceService', () => {
  let service: SystemResourceService;
  let getHealthcheck: Mock<() => Observable<string>>;
  let getAbout: Mock<(showDetails?: boolean) => Observable<AboutResponse>>;

  beforeEach(() => {
    getHealthcheck = vi.fn(() => of('Healthy'));
    getAbout = vi.fn(() => of(ABOUT));
    const systemApiDouble: Partial<SystemApiFacade> = { getHealthcheck, getAbout };
    TestBed.configureTestingModule({
      providers: [{ provide: SystemApiFacade, useValue: systemApiDouble }],
    });
    service = TestBed.inject(SystemResourceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('state', () => {
    it('starts with the initial panel state', () => {
      const state = service.state();

      expect(state).toEqual(initialResourcePanelState);
    });
  });

  describe('runHealthcheck', () => {
    it('stores the healthcheck status as the item result', () => {
      service.runHealthcheck();

      expect(service.state()).toMatchObject({ itemResult: 'Healthy', loading: false, error: null });
    });

    it('marks the state as loading while the request is pending', () => {
      getHealthcheck.mockReturnValue(new Subject<string>());

      service.runHealthcheck();

      expect(service.state().loading).toBe(true);
    });

    it('stores the error message when the request fails', () => {
      getHealthcheck.mockReturnValue(throwError(() => new Error('Unavailable')));

      service.runHealthcheck();

      expect(service.state()).toMatchObject({ loading: false, error: 'Unavailable' });
    });

    it.each([
      { label: 'a non-object error', error: 'boom' },
      { label: 'an object without a message', error: { status: 500 } },
    ])('uses a generic error message for $label', ({ error }) => {
      getHealthcheck.mockReturnValue(throwError(() => error));

      service.runHealthcheck();

      expect(service.state().error).toBe('Request failed');
    });

    it('clears a previous error when a new request starts', () => {
      getHealthcheck.mockReturnValueOnce(throwError(() => new Error('Unavailable')));
      service.runHealthcheck();
      getHealthcheck.mockReturnValue(new Subject<string>());

      service.runHealthcheck();

      expect(service.state().error).toBeNull();
    });
  });

  describe('runAbout', () => {
    it('requests detailed about information and stores it as the item result', () => {
      service.runAbout();

      expect(getAbout).toHaveBeenCalledExactlyOnceWith(true);
      expect(service.state()).toMatchObject({ itemResult: ABOUT, loading: false, error: null });
    });

    it('marks the state as loading while the request is pending', () => {
      getAbout.mockReturnValue(new Subject<AboutResponse>());

      service.runAbout();

      expect(service.state().loading).toBe(true);
    });

    it('stores the error message when the request fails', () => {
      getAbout.mockReturnValue(throwError(() => new Error('Forbidden')));

      service.runAbout();

      expect(service.state()).toMatchObject({ loading: false, error: 'Forbidden' });
    });

    it('uses a generic error message for a non-object error', () => {
      getAbout.mockReturnValue(throwError(() => 'boom'));

      service.runAbout();

      expect(service.state().error).toBe('Request failed');
    });
  });
});
