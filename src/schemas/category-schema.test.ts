import { createCategorySchema } from './category-schema';

describe('createCategorySchema', () => {
  const existingCategories = [
    { id: 'cat-1', name: 'Electronics' },
    { id: 'cat-2', name: 'Groceries' },
  ];

  it('validates a valid new category name', async () => {
    const schema = createCategorySchema({ existingCategories });
    await expect(schema.validate({ name: 'Books' })).resolves.toBeTruthy();
  });

  it('rejects category name shorter than 2 characters', async () => {
    const schema = createCategorySchema({ existingCategories });
    await expect(schema.validate({ name: 'A' })).rejects.toThrow(
      'Category name must be at least 2 characters',
    );
  });

  it('rejects category name longer than 30 characters', async () => {
    const schema = createCategorySchema({ existingCategories });
    await expect(schema.validate({ name: 'A'.repeat(31) })).rejects.toThrow(
      'Category name must be at most 30 characters',
    );
  });

  it('rejects empty or whitespace-only category name', async () => {
    const schema = createCategorySchema({ existingCategories });
    await expect(schema.validate({ name: '   ' })).rejects.toThrow('Category name is required');
  });

  it('rejects duplicate category name (case-insensitive and trimmed)', async () => {
    const schema = createCategorySchema({ existingCategories });
    await expect(schema.validate({ name: 'electronics' })).rejects.toThrow(
      'Category name already exists',
    );
    await expect(schema.validate({ name: '  GROCERIES  ' })).rejects.toThrow(
      'Category name already exists',
    );
  });

  it('allows retaining the current category name when renaming', async () => {
    // When editing 'cat-1', keeping the name 'Electronics' is valid
    const schema = createCategorySchema({
      existingCategories,
      currentCategoryId: 'cat-1',
    });
    await expect(schema.validate({ name: 'Electronics' })).resolves.toBeTruthy();
    await expect(schema.validate({ name: 'electronics' })).resolves.toBeTruthy();
  });

  it('rejects renaming to another existing category name', async () => {
    // When editing 'cat-1', changing name to 'Groceries' must be rejected
    const schema = createCategorySchema({
      existingCategories,
      currentCategoryId: 'cat-1',
    });
    await expect(schema.validate({ name: 'Groceries' })).rejects.toThrow(
      'Category name already exists',
    );
  });
});
