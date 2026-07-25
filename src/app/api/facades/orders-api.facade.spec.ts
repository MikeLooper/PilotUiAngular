import { HttpTestingController } from '@angular/common/http/testing';
import { OrdersApiFacade } from './orders-api.facade';
import { expectDelete, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('OrdersApiFacade', () => {
  let facade: OrdersApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(OrdersApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deletes an order', () => {
    let completed = false;

    facade.delete(11077).subscribe((result) => {
      completed = result === undefined;
    });

    const request = expectDelete(httpMock, 'http://localhost:53060/orders/delete/11077');
    request.flush({});

    expect(completed).toBe(true);
  });
});
