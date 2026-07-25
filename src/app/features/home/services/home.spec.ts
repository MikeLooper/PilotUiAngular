import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SystemApiFacade } from '../../../api/facades/system-api.facade';

import { HomeFacade } from './home';

describe('HomeFacade', () => {
  let service: HomeFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SystemApiFacade,
          useValue: {
            getHealthcheck: () => of('Healthy'),
            getAbout: () => of({ apiVersion: '1.0', deployDate: '2026-07-24' }),
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
