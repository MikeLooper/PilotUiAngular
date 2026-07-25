import { Injectable } from '@angular/core';
import { CategoriesApiFacade } from '../../../../api/facades/categories-api.facade';
import { CategoriesDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class CategoriesResourceVmFacade extends BaseResourceCrudVmFacade<CategoriesDto> {
  public readonly key = 'categories' as const;

  public constructor(private readonly categoriesApiFacade: CategoriesApiFacade) {
    super({
      heading: 'Categories API',
      description: 'Browse and manage categories with search, sorting, and paging.',
      primaryIdLabel: 'Category ID',
      defaultPrimaryId: '1',
      pageDefaults: {
        initialPrimaryId: '1',
        pageSize: 8,
        autoLoadOnEnter: true,
        forceRefreshOnEnter: false,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.categoriesApiFacade.getAllDtos(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.categoriesApiFacade.getById(this.asNumberishId(primaryId, '1'));
  }

  protected createSampleDto(): CategoriesDto {
    return {
      categoryID: 0,
      categoryName: 'Sample category',
      description: 'Created from Categories resource page',
      picture: null,
    };
  }

  protected updateSampleDto(primaryId?: string): CategoriesDto {
    return {
      categoryID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      categoryName: 'Updated category',
      description: 'Updated from Categories resource page',
      picture: null,
    };
  }

  protected addDto(dto: CategoriesDto) {
    return this.categoriesApiFacade.add(dto);
  }

  protected updateDto(dto: CategoriesDto) {
    return this.categoriesApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.categoriesApiFacade.delete(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected mapDtoToRecord(dto: CategoriesDto): ResourceRecord {
    return {
      primaryId: String(dto.categoryID),
      title: dto.categoryName?.trim() || 'Untitled category',
      subtitle: dto.description?.trim() || 'No description',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const category = value as CategoriesDto;

    return [
      this.createFieldsSection('Category profile', [
        { label: 'Category ID', value: category.categoryID },
        { label: 'Name', value: category.categoryName },
        { label: 'Description', value: category.description },
      ]),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Category', 'Category ID', value);
  }
}
