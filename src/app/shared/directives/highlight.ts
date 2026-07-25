import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  public readonly appHighlight = input<string>('rgba(255, 232, 179, 0.75)');

  public constructor() {
    effect(() => {
      this.renderer.setStyle(
        this.elementRef.nativeElement,
        'backgroundColor',
        this.appHighlight()
      );
    });
  }
}
