import { Injectable } from '@angular/core';
import { ProductsApiFacade } from '../../../../api/facades/products-api.facade';
import { ProductsDto } from '../../../../api/generated';
import { BaseResourceCrudVmFacade } from './base-resource-crud-vm.facade';
import { ResourceDetailSection, ResourceRecord } from './resource-vm.models';

@Injectable({ providedIn: 'root' })
export class ProductsResourceVmFacade extends BaseResourceCrudVmFacade<ProductsDto> {
  public readonly key = 'products' as const;

  public constructor(private readonly productsApiFacade: ProductsApiFacade) {
    super({
      heading: 'Products API',
      description: 'Manage product inventory records with page-level view models.',
      primaryIdLabel: 'Product ID',
      defaultPrimaryId: '1',
      pageDefaults: {
        initialPrimaryId: '1',
        initialSearchTerm: 'chai',
        pageSize: 10,
        autoLoadOnEnter: true,
      },
    });
  }

  protected loadAllDtos(forceRefresh: boolean) {
    return this.productsApiFacade.getAll(forceRefresh);
  }

  protected getByIdDto(primaryId: string) {
    return this.productsApiFacade.getById(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected createSampleDto(): ProductsDto {
    return {
      productID: 0,
      productName: 'Sample Product',
      unitPrice: 19.99,
      unitsInStock: 20,
      unitsOnOrder: 0,
      reorderLevel: 5,
      discontinued: false,
    };
  }

  protected updateSampleDto(primaryId?: string): ProductsDto {
    return {
      productID: this.asNumberishId(primaryId, this.defaultPrimaryId),
      productName: 'Updated Product',
      unitPrice: 21.49,
      unitsInStock: 18,
      unitsOnOrder: 0,
      reorderLevel: 5,
      discontinued: false,
    };
  }

  protected addDto(dto: ProductsDto) {
    return this.productsApiFacade.add(dto);
  }

  protected updateDto(dto: ProductsDto) {
    return this.productsApiFacade.update(dto);
  }

  protected deleteDto(primaryId: string) {
    return this.productsApiFacade.delete(this.asNumberishId(primaryId, this.defaultPrimaryId));
  }

  protected mapDtoToRecord(dto: ProductsDto): ResourceRecord {
    return {
      primaryId: String(dto.productID),
      title: dto.productName?.trim() || `Product #${dto.productID}`,
      subtitle:
        [dto.quantityPerUnit, dto.unitPrice ? `$${dto.unitPrice}` : null]
          .filter(Boolean)
          .join(' • ') || 'No details',
      raw: dto,
    };
  }

  public override mapSelectedItemSections(value: unknown): readonly ResourceDetailSection[] {
    const product = value as ProductsDto;

    return [
      this.createFieldsSection('Product snapshot', [
        { label: 'Product ID', value: product.productID },
        { label: 'Name', value: product.productName },
        { label: 'Supplier ID', value: product.supplierID },
        { label: 'Category ID', value: product.categoryID },
        { label: 'Quantity per unit', value: product.quantityPerUnit },
      ]),
      this.createTableSection(
        'Inventory metrics',
        ['Unit price', 'In stock', 'On order', 'Reorder level', 'Discontinued'],
        [
          [
            product.unitPrice,
            product.unitsInStock,
            product.unitsOnOrder,
            product.reorderLevel,
            product.discontinued,
          ],
        ]
      ),
    ];
  }

  public override mapMutationResultSections(value: unknown): readonly ResourceDetailSection[] {
    return this.mapMutationResultForResource('Product', 'Product ID', value);
  }
}
