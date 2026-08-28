import { HttpTestingController } from '@angular/common/http/testing';
import { CategoriesApiFacade } from './categories-api.facade';
import { expectGet, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('CategoriesApiFacade', () => {
  let facade: CategoriesApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(CategoriesApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps API DTO objects into feature items', () => {
    let resultLength = 0;

    facade.getAll(true).subscribe((result) => {
      resultLength = result.length;
      expect(result[0]?.name).toBe('Beverages');
    });

    const request = expectGet(httpMock, 'http://localhost:53060/v1/categories/get-all');

    request.flush([
      {
        categoryID: 1,
        categoryName: 'Beverages',
        description: 'Soft drinks',
      },
    ]);

    expect(resultLength).toBe(1);
  });
});
