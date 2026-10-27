import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppComponent } from './app';

@Component({ template: '<p>Routed page content</p>' })
class RoutedPageComponent {}

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: 'page', component: RoutedPageComponent }])],
    });
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the application header with the Pilot UI title', async () => {
    const fixture = TestBed.createComponent(AppComponent);

    await fixture.whenStable();

    const heading = (fixture.nativeElement as HTMLElement).querySelector('app-header h1');
    expect(heading?.textContent?.trim()).toBe('Pilot UI');
  });

  it('renders the routed page inside the main content region', async () => {
    const fixture = TestBed.createComponent(AppComponent);

    await TestBed.inject(Router).navigateByUrl('/page');
    await fixture.whenStable();

    const main = (fixture.nativeElement as HTMLElement).querySelector('main');
    expect(main?.textContent).toContain('Routed page content');
  });
});
