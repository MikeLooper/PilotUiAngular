import { HttpTestingController } from '@angular/common/http/testing';
import { SuppliersApiFacade } from './suppliers-api.facade';
import { expectPost, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('SuppliersApiFacade', () => {
  let facade: SuppliersApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(SuppliersApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds a supplier', () => {
    let createdId: number | string | undefined;

    facade.add({ supplierID: 0, companyName: 'New Supplier' }).subscribe((result) => {
      createdId = result.id;
    });

    const request = expectPost(httpMock, 'http://localhost:53060/suppliers/add');
    request.flush({ id: 91 });

    expect(createdId).toBe(91);
  });
});
