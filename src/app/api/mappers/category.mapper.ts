import { CategoriesDto } from '../generated';
import { CategoryListItem } from '../../features/home/models/category-list-item';

export function mapCategoryDtoToListItem(dto: CategoriesDto): CategoryListItem {
  return {
    id: Number(dto.categoryID),
    name: dto.categoryName?.trim() || 'Untitled category',
    description: dto.description?.trim() || 'No description provided.',
  };
}
