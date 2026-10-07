import { DEFAULT_CATEGORIES } from '@/constants/default-categories';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { Category } from '@/types/category';
import type { StockMovement } from '@/types/history';
import type { Product } from '@/types/product';
import {
  createDefaultCategories,
  isValidCategoryList,
  isValidHistoryList,
  isValidProductList,
  isValidTheme,
  loadInitialState,
} from './initial-state';

beforeEach(() => {
  localStorage.clear();
});

describe('createDefaultCategories', () => {
  it('creates default categories with unique IDs and isDefault: true', () => {
    const categories = createDefaultCategories();
    expect(categories.length).toBe(DEFAULT_CATEGORIES.length);

    const names = categories.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining([...DEFAULT_CATEGORIES]));

    for (const cat of categories) {
      expect(cat.isDefault).toBe(true);
      expect(typeof cat.id).toBe('string');
      expect(cat.id.length).toBeGreaterThan(0);
    }

    const uniqueIds = new Set(categories.map((c) => c.id));
    expect(uniqueIds.size).toBe(categories.length);
  });
});

describe('validation helpers', () => {
  it('validates theme', () => {
    expect(isValidTheme('light')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
    expect(isValidTheme('blue')).toBe(false);
    expect(isValidTheme(null)).toBe(false);
  });

  it('rejects category list with duplicates', () => {
    const duplicates: Category[] = [
      { id: '1', name: 'Electronics', isDefault: true },
      { id: '2', name: 'electronics', isDefault: false },
    ];
    expect(isValidCategoryList(duplicates)).toBe(false);
  });

  it('rejects product list with invalid product', () => {
    const invalidProducts = [
      {
        productId: 'PRD-1',
        name: 'Item',
        categoryId: 'cat-1',
        price: -10, // negative price
        stock: 5,
        lowStockThreshold: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    expect(isValidProductList(invalidProducts)).toBe(false);
  });

  it('rejects history list with mismatched stock transition', () => {
    const invalidHistory: StockMovement[] = [
      {
        id: 'hist-1',
        productId: 'PRD-1',
        productName: 'Item',
        type: 'restock',
        change: 5,
        previousStock: 10,
        newStock: 20, // should be 15
        timestamp: new Date().toISOString(),
      },
    ];
    expect(isValidHistoryList(invalidHistory)).toBe(false);
  });
});

describe('loadInitialState', () => {
  it('returns default categories and empty arrays on a clean first run', () => {
    const { state, storageError } = loadInitialState();

    expect(storageError).toBeNull();
    expect(state.products).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.categories.length).toBe(DEFAULT_CATEGORIES.length);
    expect(state.categories.every((c) => c.isDefault)).toBe(true);
  });

  it('hydrates valid state from localStorage correctly', () => {
    const mockCategories: Category[] = [{ id: 'cat-1', name: 'Custom Cat', isDefault: false }];
    const mockProducts: Product[] = [
      {
        productId: 'PRD-100',
        name: 'Keyboard',
        categoryId: 'cat-1',
        price: 4500,
        stock: 20,
        lowStockThreshold: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const mockHistory: StockMovement[] = [
      {
        id: 'hist-1',
        productId: 'PRD-100',
        productName: 'Keyboard',
        type: 'initial',
        change: 20,
        previousStock: 0,
        newStock: 20,
        timestamp: new Date().toISOString(),
      },
    ];

    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(mockCategories));
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(mockProducts));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(mockHistory));

    const { state, storageError } = loadInitialState();

    expect(storageError).toBeNull();
    expect(state.categories).toEqual(mockCategories);
    expect(state.products).toEqual(mockProducts);
    expect(state.history).toEqual(mockHistory);
  });

  it('replaces corrupted categories with default categories and reports storageError', () => {
    localStorage.setItem(STORAGE_KEYS.categories, '{not-valid-json}');

    const { state, storageError } = loadInitialState();

    expect(storageError).not.toBeNull();
    expect(storageError?.code).toBe('STORAGE_ERROR');
    expect(state.categories.length).toBe(DEFAULT_CATEGORIES.length);
  });

  it('drops products referencing non-existent categories and reports storageError', () => {
    const mockCategories: Category[] = [{ id: 'cat-1', name: 'Gadgets', isDefault: false }];
    const orphanProducts: Product[] = [
      {
        productId: 'PRD-200',
        name: 'Headset',
        categoryId: 'non-existent-cat', // orphan reference
        price: 2500,
        stock: 10,
        lowStockThreshold: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(mockCategories));
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(orphanProducts));

    const { state, storageError } = loadInitialState();

    expect(storageError).not.toBeNull();
    expect(storageError?.code).toBe('STORAGE_ERROR');
    expect(state.products).toEqual([]);
  });

  it('survives corrupted history without dropping valid products and categories', () => {
    const mockCategories: Category[] = [{ id: 'cat-1', name: 'Gadgets', isDefault: false }];
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(mockCategories));
    localStorage.setItem(STORAGE_KEYS.history, 'corrupted');

    const { state, storageError } = loadInitialState();

    expect(storageError?.code).toBe('STORAGE_ERROR');
    expect(state.categories).toEqual(mockCategories);
    expect(state.history).toEqual([]);
  });
});
