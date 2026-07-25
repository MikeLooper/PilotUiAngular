import { HttpTestingController } from '@angular/common/http/testing';
import { OrderDetailsApiFacade } from './order-details-api.facade';
import { expectGet, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('OrderDetailsApiFacade', () => {
  let facade: OrderDetailsApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(OrderDetailsApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets one order detail by product and order id', () => {
    let quantity: number | string | undefined;

    facade.getById(1, 10248).subscribe((result) => {
      quantity = result.quantity;
    });

    const request = expectGet(
      httpMock,
      'http://localhost:53060/order-details/get/product/1/order/10248'
    );
    request.flush({ orderID: 10248, productID: 1, unitPrice: 18, quantity: 10, discount: 0 });

    expect(quantity).toBe(10);
  });
});
