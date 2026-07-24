import { HttpTestingController } from '@angular/common/http/testing';
import { ShippersApiFacade } from './shippers-api.facade';
import { expectGet, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('ShippersApiFacade', () => {
  let facade: ShippersApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(ShippersApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads all shippers', () => {
    let resultLength = 0;

    facade.getAll(true).subscribe((result) => {
      resultLength = result.length;
      expect(result[0]?.companyName).toBe('Speedy Express');
    });

    const request = expectGet(httpMock, 'http://localhost:53060/shippers/get-all');
    request.flush([{ shipperID: 1, companyName: 'Speedy Express' }]);

    expect(resultLength).toBe(1);
  });
});
