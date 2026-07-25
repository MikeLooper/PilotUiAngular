import { HttpTestingController } from '@angular/common/http/testing';
import { AboutResponse } from '../generated';
import { SystemApiFacade } from './system-api.facade';
import { expectGet, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('SystemApiFacade', () => {
  let facade: SystemApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(SystemApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('runs healthcheck endpoint', () => {
    let health = '';

    facade.getHealthcheck().subscribe((result) => {
      health = result;
    });

    const request = expectGet(httpMock, 'http://localhost:53060/healthcheck');
    request.flush('Healthy');

    expect(health).toBe('Healthy');
  });

  it('runs about endpoint', () => {
    let about: AboutResponse | null = null;

    facade.getAbout().subscribe((result) => {
      about = result;
    });

    const request = expectGet(httpMock, 'http://localhost:53060/about?show-details=true');
    request.flush({
      name: 'PilotApiDotNet',
      apiVersion: '0.1.1',
    });

    expect(about).toEqual({
      name: 'PilotApiDotNet',
      apiVersion: '0.1.1',
    });
  });
});
