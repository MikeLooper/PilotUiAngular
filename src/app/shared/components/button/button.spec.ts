import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonComponent } from './button';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;

  function renderedButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ButtonComponent] });
    fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('label', 'Save');
  });

  it('creates the component', async () => {
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('label', () => {
    it('renders the label as the button text', async () => {
      await fixture.whenStable();

      expect(renderedButton().textContent?.trim()).toBe('Save');
    });

    it('updates the text when the label changes', async () => {
      await fixture.whenStable();

      fixture.componentRef.setInput('label', 'Saved');
      await fixture.whenStable();

      expect(renderedButton().textContent?.trim()).toBe('Saved');
    });
  });

  describe('type', () => {
    it('defaults to a plain button', async () => {
      await fixture.whenStable();

      expect(renderedButton().getAttribute('type')).toBe('button');
    });

    it.each(['submit', 'reset'] as const)('renders the %s type when set', async (type) => {
      fixture.componentRef.setInput('type', type);

      await fixture.whenStable();

      expect(renderedButton().getAttribute('type')).toBe(type);
    });
  });

  describe('disabled', () => {
    it('is enabled by default', async () => {
      await fixture.whenStable();

      expect(renderedButton().disabled).toBe(false);
    });

    it('disables the button when set to true', async () => {
      fixture.componentRef.setInput('disabled', true);

      await fixture.whenStable();

      expect(renderedButton().disabled).toBe(true);
    });
  });
});
