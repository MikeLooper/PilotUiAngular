import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HighlightDirective } from './highlight';

@Component({
  imports: [HighlightDirective],
  template: '<p [appHighlight]="color()">Highlighted text</p>',
})
class HostComponent {
  public readonly color = signal('rgb(1, 2, 3)');
}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  function paragraph(): HTMLParagraphElement {
    return fixture.nativeElement.querySelector('p') as HTMLParagraphElement;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
  });

  it('creates the directive', () => {
    expect(fixture.debugElement.query(By.directive(HighlightDirective))).toBeTruthy();
  });

  describe('appHighlight', () => {
    it('applies the bound color as the background color', () => {
      const backgroundColor = paragraph().style.backgroundColor;

      expect(backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('updates the background color when the bound color changes', async () => {
      fixture.componentInstance.color.set('rgb(4, 5, 6)');

      await fixture.whenStable();

      expect(paragraph().style.backgroundColor).toBe('rgb(4, 5, 6)');
    });
  });
});
