import { TestBed } from '@angular/core/testing';

import { APP_ENV } from '../config/app-config';
import { ApiService } from './api';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENV,
          useValue: {
            production: false,
            apiBaseUrl: 'http://localhost:53060',
            apiVersion: '1.0',
            requestTimeoutMs: 15000,
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
