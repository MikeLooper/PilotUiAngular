import { HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';

import { AboutResponse } from '../generated';
import { SystemApiFacade } from './system-api.facade';
import { setupFacadeTestbed } from './testing/setup-facade-testbed';

const ROOT_URL = 'http://localhost:53060';
const ABOUT: AboutResponse = { name: 'PilotApiDotNet', apiVersion: '1.1.2' };

describe('SystemApiFacade', () => {
  let facade: SystemApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(SystemApiFacade, ROOT_URL);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('getHealthcheck', () => {
    it('requests the healthcheck endpoint and emits the status text', async () => {
      const result = lastValueFrom(facade.getHealthcheck());

      httpMock.expectOne({ method: 'GET', url: `${ROOT_URL}/healthcheck` }).flush('Healthy');

      expect(await result).toBe('Healthy');
    });

    it('propagates HTTP errors to the caller', async () => {
      const result = lastValueFrom(facade.getHealthcheck());

      httpMock
        .expectOne(`${ROOT_URL}/healthcheck`)
        .flush(null, { status: 503, statusText: 'Service Unavailable' });

      await expect(result).rejects.toMatchObject({ status: 503 });
    });
  });

  describe('getAbout', () => {
    it('requests details by default and emits the about response', async () => {
      const result = lastValueFrom(facade.getAbout());

      const request = httpMock.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === `${ROOT_URL}/about`,
      );
      request.flush(ABOUT);

      expect(request.request.params.get('show-details')).toBe('true');
      expect(await result).toEqual(ABOUT);
    });

    it('passes show-details=false when details are not requested', async () => {
      const result = lastValueFrom(facade.getAbout(false));

      const request = httpMock.expectOne((candidate) => candidate.url === `${ROOT_URL}/about`);
      request.flush(ABOUT);

      expect(request.request.params.get('show-details')).toBe('false');
      expect(await result).toEqual(ABOUT);
    });
  });
});
