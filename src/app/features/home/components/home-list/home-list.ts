import { Component, input } from '@angular/core';
import { TruncatePipe } from '../../../../shared/pipes/truncate-pipe';
import { CategoryListItem } from '../../models/category-list-item';

@Component({
  selector: 'app-home-list',
  imports: [TruncatePipe],
  templateUrl: './home-list.html',
  styleUrl: './home-list.scss',
})
export class HomeListComponent {
  public readonly items = input.required<readonly CategoryListItem[]>();
}
