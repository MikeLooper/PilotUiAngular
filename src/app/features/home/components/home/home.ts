import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { HighlightDirective } from '../../../../shared/directives/highlight';
import { HomeFacade } from '../../services/home';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ButtonComponent, HighlightDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePageComponent {
  private readonly homeFacade = inject(HomeFacade);

  public readonly vm = this.homeFacade.vm;

  public onReload(): void {
    this.homeFacade.reload();
  }
}
