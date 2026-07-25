import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SystemApiFacade } from '../../../../api/facades/system-api.facade';

import { HomePageComponent } from './home';

describe('Home', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: SystemApiFacade,
          useValue: {
            getHealthcheck: () => of('Healthy'),
            getAbout: () => of({ apiVersion: '1.0', deployDate: '2026-07-24' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
