import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryListItem } from '../../models/category-list-item';
import { HomeListComponent } from './home-list';

const ITEMS: readonly CategoryListItem[] = [
  { id: 1, name: 'Beverages', description: 'Soft drinks, coffees, teas, beers, and ales' },
  { id: 2, name: 'Condiments', description: 'Sweet and savory sauces' },
];

describe('HomeListComponent', () => {
  let fixture: ComponentFixture<HomeListComponent>;

  function listItems(): HTMLLIElement[] {
    const list = (fixture.nativeElement as HTMLElement).querySelector(
      'ul[aria-label="Categories list"]',
    );
    return Array.from(list?.querySelectorAll('li') ?? []);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HomeListComponent] });
    fixture = TestBed.createComponent(HomeListComponent);
  });

  it('creates the component', async () => {
    fixture.componentRef.setInput('items', ITEMS);

    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('items', () => {
    it('renders one list entry per item with its name, description, and id', async () => {
      fixture.componentRef.setInput('items', ITEMS);

      await fixture.whenStable();

      const entries = listItems();
      expect(entries).toHaveLength(2);
      expect(entries[0]?.querySelector('h3')?.textContent).toBe('Beverages');
      expect(entries[0]?.querySelector('p')?.textContent).toBe(
        'Soft drinks, coffees, teas, beers, and ales',
      );
      expect(entries[0]?.querySelector('small')?.textContent?.trim()).toBe('ID: 1');
    });

    it('truncates descriptions longer than 140 characters', async () => {
      const longDescription = 'a'.repeat(141);
      fixture.componentRef.setInput('items', [
        { id: 3, name: 'Long', description: longDescription },
      ]);

      await fixture.whenStable();

      expect(listItems()[0]?.querySelector('p')?.textContent).toBe(`${'a'.repeat(140)}...`);
    });

    it('renders an empty list when there are no items', async () => {
      fixture.componentRef.setInput('items', []);

      await fixture.whenStable();

      expect(listItems()).toHaveLength(0);
    });
  });
});
