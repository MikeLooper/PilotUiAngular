import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class ButtonComponent {
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
  public readonly label = input.required<string>();
  public readonly disabled = input(false);
}
