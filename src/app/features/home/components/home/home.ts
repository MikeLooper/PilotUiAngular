import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { HighlightDirective } from '../../../../shared/directives/highlight';
import { HomeListComponent } from '../home-list/home-list';
import { HomeFacade } from '../../services/home';

@Component({
  selector: 'app-home-page',
  imports: [FormsModule, ButtonComponent, HomeListComponent, HighlightDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePageComponent {
  private readonly homeFacade = inject(HomeFacade);

  public readonly vm = this.homeFacade.vm;

  public onSearchTermChanged(term: string): void {
    this.homeFacade.onSearchTermChanged(term);
  }

  public onToggleSortDirection(): void {
    this.homeFacade.toggleSortDirection();
  }

  public onReload(): void {
    this.homeFacade.reload();
  }

  public onPageChanged(page: number): void {
    this.homeFacade.goToPage(page);
  }
}
