import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment.development';
import { APP_ENV, provideAppEnvironment } from './app-config';

describe('provideAppEnvironment', () => {
  it('provides the given environment under the APP_ENV token', () => {
    TestBed.configureTestingModule({ providers: [provideAppEnvironment(environment)] });

    const provided = TestBed.inject(APP_ENV);

    expect(provided).toBe(environment);
  });
});
