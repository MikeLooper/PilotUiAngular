import { HttpTestingController } from '@angular/common/http/testing';
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
});
