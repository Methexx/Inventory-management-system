import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import { createProduct, deleteProduct, restoreProduct, updateProduct } from './product-service';

describe('product-service', () => {
  const baseCategory = {
    id: 'cat-electronics',
    name: 'Electronics',
    isDefault: true,
  };

  const existingProduct: Product = {
    productId: 'PRD-100',
    name: 'Mechanical Keyboard',
    categoryId: 'cat-electronics',
    price: 15000,
    stock: 10,
    lowStockThreshold: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const initialState: InventoryState = {
    products: [existingProduct],
    categories: [baseCategory],
    history: [],
  };

  describe('createProduct', () => {
    it('creates a product with initial stock and movement history', () => {
      const result = createProduct(
        initialState,
        {
          name: 'Gaming Mouse',
          productId: 'PRD-200',
          categoryId: 'cat-electronics',
          price: 5500.5,
          stock: 25,
          lowStockThreshold: 3,
        },
        {
          timestamp: '2026-01-02T10:00:00.000Z',
          historyEntryId: 'hist-init-1',
        },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.productId).toBe('PRD-200');
        expect(result.data.product.name).toBe('Gaming Mouse');
        expect(result.data.product.stock).toBe(25);
        expect(result.data.product.createdAt).toBe('2026-01-02T10:00:00.000Z');
        expect(result.data.historyEntry).not.toBeNull();
        expect(result.data.historyEntry?.type).toBe('initial');
        expect(result.data.historyEntry?.change).toBe(25);
      }
    });

    it('creates a product with zero stock and null historyEntry', () => {
      const result = createProduct(
        initialState,
        {
          name: 'USB-C Cable',
          productId: 'PRD-300',
          categoryId: 'cat-electronics',
          price: 1200,
          stock: 0,
          lowStockThreshold: 5,
        },
        {
          timestamp: '2026-01-02T10:00:00.000Z',
          historyEntryId: 'hist-init-2',
        },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.stock).toBe(0);
        expect(result.data.historyEntry).toBeNull();
      }
    });

    it('fails with DUPLICATE_PRODUCT_ID on duplicate SKU (case-insensitive)', () => {
      const result = createProduct(
        initialState,
        {
          name: 'Duplicate Item',
          productId: 'prd-100', // matches PRD-100
          categoryId: 'cat-electronics',
          price: 2000,
          stock: 5,
          lowStockThreshold: 2,
        },
        {
          timestamp: '2026-01-02T10:00:00.000Z',
          historyEntryId: 'hist-init-3',
        },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('DUPLICATE_PRODUCT_ID');
      }
    });

    it('fails with CATEGORY_NOT_FOUND when category does not exist', () => {
      const result = createProduct(
        initialState,
        {
          name: 'Orphan Item',
          productId: 'PRD-400',
          categoryId: 'non-existent-cat',
          price: 2000,
          stock: 5,
          lowStockThreshold: 2,
        },
        {
          timestamp: '2026-01-02T10:00:00.000Z',
          historyEntryId: 'hist-init-4',
        },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
      }
    });

    it('fails with VALIDATION_ERROR on invalid name bounds', () => {
      const tooShort = createProduct(
        initialState,
        {
          name: 'A',
          productId: 'PRD-500',
          categoryId: 'cat-electronics',
          price: 1000,
          stock: 5,
          lowStockThreshold: 2,
        },
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h-1' },
      );
      expect(tooShort.ok).toBe(false);
      if (!tooShort.ok) expect(tooShort.error.code).toBe('VALIDATION_ERROR');

      const tooLong = createProduct(
        initialState,
        {
          name: 'A'.repeat(81),
          productId: 'PRD-501',
          categoryId: 'cat-electronics',
          price: 1000,
          stock: 5,
          lowStockThreshold: 2,
        },
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h-2' },
      );
      expect(tooLong.ok).toBe(false);
      if (!tooLong.ok) expect(tooLong.error.code).toBe('VALIDATION_ERROR');
    });

    it('fails with VALIDATION_ERROR on price bounds and decimal precision', () => {
      const negativePrice = createProduct(
        initialState,
        {
          name: 'Item',
          productId: 'PRD-502',
          categoryId: 'cat-electronics',
          price: -50,
          stock: 5,
          lowStockThreshold: 2,
        },
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h-3' },
      );
      expect(negativePrice.ok).toBe(false);
      if (!negativePrice.ok) expect(negativePrice.error.code).toBe('VALIDATION_ERROR');

      const threeDecimals = createProduct(
        initialState,
        {
          name: 'Item',
          productId: 'PRD-503',
          categoryId: 'cat-electronics',
          price: 99.999,
          stock: 5,
          lowStockThreshold: 2,
        },
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h-4' },
      );
      expect(threeDecimals.ok).toBe(false);
      if (!threeDecimals.ok) expect(threeDecimals.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('updateProduct', () => {
    it('updates mutable fields and refreshes updatedAt while preserving productId and stock', () => {
      const result = updateProduct(
        initialState,
        'PRD-100',
        {
          name: 'Upgraded Mechanical Keyboard',
          categoryId: 'cat-electronics',
          price: 18000,
          lowStockThreshold: 6,
        },
        { timestamp: '2026-01-03T12:00:00.000Z' },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.productId).toBe('PRD-100');
        expect(result.data.product.name).toBe('Upgraded Mechanical Keyboard');
        expect(result.data.product.stock).toBe(10); // unmodified
        expect(result.data.product.createdAt).toBe('2026-01-01T00:00:00.000Z'); // preserved
        expect(result.data.product.updatedAt).toBe('2026-01-03T12:00:00.000Z'); // refreshed
      }
    });

    it('fails with NOT_FOUND if product does not exist', () => {
      const result = updateProduct(
        initialState,
        'NON-EXISTENT',
        {
          name: 'New Name',
          categoryId: 'cat-electronics',
          price: 1000,
          lowStockThreshold: 2,
        },
        { timestamp: '2026-01-03T12:00:00.000Z' },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('fails with CATEGORY_NOT_FOUND if target category does not exist', () => {
      const result = updateProduct(
        initialState,
        'PRD-100',
        {
          name: 'New Name',
          categoryId: 'cat-deleted',
          price: 1000,
          lowStockThreshold: 2,
        },
        { timestamp: '2026-01-03T12:00:00.000Z' },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('deleteProduct', () => {
    it('returns the deleted product on success', () => {
      const result = deleteProduct(initialState, 'prd-100');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.productId).toBe('PRD-100');
      }
    });

    it('fails with NOT_FOUND when product does not exist', () => {
      const result = deleteProduct(initialState, 'PRD-MISSING');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('restoreProduct', () => {
    const deletedProduct: Product = {
      productId: 'PRD-RESTORE',
      name: 'Restorable Item',
      categoryId: 'cat-electronics',
      price: 2500,
      stock: 8,
      lowStockThreshold: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('restores the product successfully when category exists and ID is free', () => {
      const result = restoreProduct(initialState, deletedProduct);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.productId).toBe('PRD-RESTORE');
        expect(result.data.product.stock).toBe(8);
      }
    });

    it('fails with DUPLICATE_PRODUCT_ID if another product took the ID', () => {
      const conflictProduct = {
        ...deletedProduct,
        productId: 'PRD-100', // taken by existingProduct
      };
      const result = restoreProduct(initialState, conflictProduct);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('DUPLICATE_PRODUCT_ID');
    });

    it('fails with CATEGORY_NOT_FOUND if product category was deleted', () => {
      const orphanProduct = {
        ...deletedProduct,
        categoryId: 'cat-deleted-in-meantime',
      };
      const result = restoreProduct(initialState, orphanProduct);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });
});
