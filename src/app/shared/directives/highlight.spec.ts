import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HighlightDirective } from './highlight';

@Component({
  imports: [HighlightDirective],
  template: '<p [appHighlight]="color">Highlighted text</p>',
})
class HostComponent {
  public color = 'rgb(1, 2, 3)';
}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('applies the configured background color', () => {
    const element = fixture.nativeElement.querySelector('p') as HTMLElement;
    expect(element.style.backgroundColor).toContain('1, 2, 3');
  });
});
