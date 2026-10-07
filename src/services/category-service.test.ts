import type { Category } from '@/types/category';
import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import { createCategory, deleteCategory, renameCategory } from './category-service';

describe('category-service', () => {
  const defaultCategory: Category = {
    id: 'cat-default',
    name: 'Electronics',
    isDefault: true,
  };

  const customCategory: Category = {
    id: 'cat-custom',
    name: 'Books',
    isDefault: false,
  };

  const productInCustomCategory: Product = {
    productId: 'PRD-BOOK',
    name: 'Programming TypeScript',
    categoryId: 'cat-custom',
    price: 3500,
    stock: 5,
    lowStockThreshold: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const initialState: InventoryState = {
    products: [productInCustomCategory],
    categories: [defaultCategory, customCategory],
    history: [],
  };

  describe('createCategory', () => {
    it('creates a custom category with isDefault: false', () => {
      const result = createCategory(initialState, 'Stationery', {
        categoryId: 'cat-stat-1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.category.id).toBe('cat-stat-1');
        expect(result.data.category.name).toBe('Stationery');
        expect(result.data.category.isDefault).toBe(false);
      }
    });

    it('fails with DUPLICATE_CATEGORY on case-insensitive duplicate name', () => {
      const result = createCategory(initialState, '  electronics  ', {
        categoryId: 'cat-dup',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('DUPLICATE_CATEGORY');
      }
    });

    it('fails with VALIDATION_ERROR when name length is outside 2-30 bounds', () => {
      const tooShort = createCategory(initialState, 'A', { categoryId: 'c1' });
      expect(tooShort.ok).toBe(false);
      if (!tooShort.ok) expect(tooShort.error.code).toBe('VALIDATION_ERROR');

      const tooLong = createCategory(initialState, 'A'.repeat(31), {
        categoryId: 'c2',
      });
      expect(tooLong.ok).toBe(false);
      if (!tooLong.ok) expect(tooLong.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('renameCategory', () => {
    it('renames a custom category successfully', () => {
      const result = renameCategory(initialState, 'cat-custom', 'Magazines & Books');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.category.name).toBe('Magazines & Books');
        expect(result.data.category.isDefault).toBe(false);
      }
    });

    it('allows retaining the same name for the category being edited', () => {
      const result = renameCategory(initialState, 'cat-custom', 'Books');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.category.name).toBe('Books');
      }
    });

    it('fails with VALIDATION_ERROR when attempting to rename a default category', () => {
      const result = renameCategory(initialState, 'cat-default', 'Consumer Electronics');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Default categories');
      }
    });

    it('fails with CATEGORY_NOT_FOUND when category does not exist', () => {
      const result = renameCategory(initialState, 'cat-missing', 'New Name');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('fails with DUPLICATE_CATEGORY when renaming to an existing category name', () => {
      const result = renameCategory(initialState, 'cat-custom', 'Electronics');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('DUPLICATE_CATEGORY');
    });
  });

  describe('deleteCategory', () => {
    it('deletes an unused custom category successfully', () => {
      const unusedCategory: Category = {
        id: 'cat-unused',
        name: 'Empty Category',
        isDefault: false,
      };
      const stateWithUnused: InventoryState = {
        ...initialState,
        categories: [...initialState.categories, unusedCategory],
      };

      const result = deleteCategory(stateWithUnused, 'cat-unused');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.categoryId).toBe('cat-unused');
      }
    });

    it('fails with CATEGORY_IN_USE when category has associated products', () => {
      const result = deleteCategory(initialState, 'cat-custom');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CATEGORY_IN_USE');
        expect(result.error.message).toContain('1 product');
      }
    });

    it('fails with VALIDATION_ERROR when trying to delete a default category', () => {
      const result = deleteCategory(initialState, 'cat-default');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Default categories');
      }
    });

    it('fails with CATEGORY_NOT_FOUND when category does not exist', () => {
      const result = deleteCategory(initialState, 'cat-missing');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });
});
