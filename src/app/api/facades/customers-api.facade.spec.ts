import { HttpTestingController } from '@angular/common/http/testing';
import { CustomersApiFacade } from './customers-api.facade';
import { expectGet, expectPost, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('CustomersApiFacade', () => {
  let facade: CustomersApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(CustomersApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads all customers', () => {
    let resultLength = 0;

    facade.getAll(true).subscribe((result) => {
      resultLength = result.length;
      expect(result[0]?.companyName).toBe('Alfreds Futterkiste');
    });

    const request = expectGet(httpMock, 'http://localhost:53060/customers/get-all');
    request.flush([{ customerID: 'ALFKI', companyName: 'Alfreds Futterkiste' }]);

    expect(resultLength).toBe(1);
  });

  it('adds a customer', () => {
    let createdId: number | string | undefined;

    facade
      .add({ customerID: 'NEW01', companyName: 'New Co' })
      .subscribe((result) => (createdId = result.id));

    const request = expectPost(httpMock, 'http://localhost:53060/customers/add');
    request.flush({ id: 'NEW01' });

    expect(createdId).toBe('NEW01');
  });
});
