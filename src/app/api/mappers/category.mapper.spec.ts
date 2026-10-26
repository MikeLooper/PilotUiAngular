import { mapCategoryDtoToListItem } from './category.mapper';

describe('mapCategoryDtoToListItem', () => {
  it('maps the id, name, and description of a complete DTO', () => {
    const dto = { categoryId: 1, categoryName: 'Beverages', description: 'Soft drinks' };

    const result = mapCategoryDtoToListItem(dto);

    expect(result).toEqual({ id: 1, name: 'Beverages', description: 'Soft drinks' });
  });

  it('converts a string id into a number', () => {
    const dto = { categoryId: '7', categoryName: 'Produce' };

    const result = mapCategoryDtoToListItem(dto);

    expect(result.id).toBe(7);
  });

  it('trims surrounding whitespace from the name and description', () => {
    const dto = { categoryId: 2, categoryName: '  Condiments ', description: ' Sauces  ' };

    const result = mapCategoryDtoToListItem(dto);

    expect(result.name).toBe('Condiments');
    expect(result.description).toBe('Sauces');
  });

  it.each([
    { label: 'empty', categoryName: '' },
    { label: 'whitespace-only', categoryName: '   ' },
  ])('uses a fallback name when the name is $label', ({ categoryName }) => {
    const dto = { categoryId: 3, categoryName };

    const result = mapCategoryDtoToListItem(dto);

    expect(result.name).toBe('Untitled category');
  });

  it.each([
    { label: 'undefined', description: undefined },
    { label: 'null', description: null },
    { label: 'whitespace-only', description: '  ' },
  ])('uses a fallback description when the description is $label', ({ description }) => {
    const dto = { categoryId: 4, categoryName: 'Seafood', description };

    const result = mapCategoryDtoToListItem(dto);

    expect(result.description).toBe('No description provided.');
  });

  it('maps a missing id to NaN', () => {
    const dto = { categoryName: 'Unsaved' };

    const result = mapCategoryDtoToListItem(dto);

    expect(result.id).toBeNaN();
  });
});
