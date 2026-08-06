import { TestBed } from '@angular/core/testing';

import { ApiService } from './api';
import { DataSourceService } from './data-source';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DataSourceService,
          useValue: {
            activeBaseUrl: () => 'http://localhost:55551',
          },
        },
      ],
    });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
