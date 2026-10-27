import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { HeaderComponent } from './header';

@Component({ template: '' })
class BlankPageComponent {}

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  function navLink(text: string): HTMLAnchorElement {
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        'nav[aria-label="Primary"] a',
      ),
    );
    const link = links.find((candidate) => candidate.textContent?.trim() === text);
    if (!link) {
      throw new Error(`No navigation link with text "${text}"`);
    }
    return link;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([
          { path: '', component: BlankPageComponent },
          { path: 'resources', component: BlankPageComponent },
          { path: 'explorer', component: BlankPageComponent },
        ]),
      ],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('title', 'Pilot UI');
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('title', () => {
    it('renders the title as the page heading', () => {
      const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');

      expect(heading?.textContent?.trim()).toBe('Pilot UI');
    });

    it('updates the heading when the title changes', async () => {
      fixture.componentRef.setInput('title', 'Pilot Admin');

      await fixture.whenStable();

      const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');
      expect(heading?.textContent?.trim()).toBe('Pilot Admin');
    });
  });

  describe('navigation', () => {
    it.each([
      { text: 'Home', href: '/' },
      { text: 'Resources', href: '/resources' },
      { text: 'API Explorer', href: '/explorer' },
    ])('links "$text" to $href', ({ text, href }) => {
      const link = navLink(text);

      expect(link.getAttribute('href')).toBe(href);
    });

    it('marks only the Home link active on the root route', () => {
      const home = navLink('Home');
      const resources = navLink('Resources');

      expect(home.classList).toContain('is-active');
      expect(resources.classList).not.toContain('is-active');
    });

    it('marks the matching link active after the user follows it', async () => {
      navLink('API Explorer').click();

      await fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/explorer');
      expect(navLink('API Explorer').classList).toContain('is-active');
      expect(navLink('Home').classList).not.toContain('is-active');
    });
  });
});
