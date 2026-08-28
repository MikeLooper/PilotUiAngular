import { HttpTestingController } from '@angular/common/http/testing';
import { ProductsApiFacade } from './products-api.facade';
import { expectPut, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('ProductsApiFacade', () => {
  let facade: ProductsApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(ProductsApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updates a product', () => {
    let completed = false;

    facade.update({ productID: 1, productName: 'Updated Product' }).subscribe((result) => {
      completed = result === undefined;
    });

    const request = expectPut(httpMock, 'http://localhost:53060/v1/products/update');
    request.flush({});

    expect(completed).toBe(true);
  });
});
