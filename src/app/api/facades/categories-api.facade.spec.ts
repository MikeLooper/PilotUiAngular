import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../generated';
import { CategoriesApiFacade } from './categories-api.facade';

describe('CategoriesApiFacade', () => {
  let facade: CategoriesApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const apiConfiguration = new ApiConfiguration();
    apiConfiguration.rootUrl = 'http://localhost:53060';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ApiConfiguration,
          useValue: apiConfiguration,
        },
      ],
    });

    facade = TestBed.inject(CategoriesApiFacade);
    httpMock = TestBed.inject(HttpTestingController);
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

    const request = httpMock.expectOne('http://localhost:53060/categories/get-all');
    expect(request.request.method).toBe('GET');

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
