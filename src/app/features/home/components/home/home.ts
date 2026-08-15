import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { HighlightDirective } from '../../../../shared/directives/highlight';
import { HomeFacade } from '../../services/home';
import { DataSourceService } from '../../../../core/services/data-source';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ButtonComponent, HighlightDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePageComponent {
  private readonly dataSourceService = inject(DataSourceService);
  private readonly homeFacade = inject(HomeFacade);

  public readonly vm = this.homeFacade.vm;
  public readonly dataSourceOptions = this.dataSourceService.options;
  public readonly selectedDataSource = this.dataSourceService.activeDataSource;

  public onReload(): void {
    this.homeFacade.reload();
  }

  public onDataSourceSelected(id: string): void {
    this.dataSourceService.selectDataSourceById(id);
    this.homeFacade.reload();
  }
}
