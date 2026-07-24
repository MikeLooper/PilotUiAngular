import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoriesApiFacade } from '../../../api/facades/categories-api.facade';

import { HomeFacade } from './home';

describe('HomeFacade', () => {
  let service: HomeFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoriesApiFacade,
          useValue: {
            getAll: () => of([]),
          },
        },
      ],
    });
    service = TestBed.inject(HomeFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
