import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import {
  selectCategoryCounts,
  selectFilteredProducts,
  selectStats,
  selectStockStatus,
} from './selectors';

describe('selectors', () => {
  const p1: Product = {
    productId: 'PRD-101',
    name: 'Apple iPad',
    categoryId: 'cat-tablets',
    price: 150000.5,
    stock: 0, // out of stock
    lowStockThreshold: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const p2: Product = {
    productId: 'PRD-102',
    name: 'Bluetooth Speaker',
    categoryId: 'cat-audio',
    price: 12500.25,
    stock: 3, // low stock (3 <= 5)
    lowStockThreshold: 5,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  };

  const p3: Product = {
    productId: 'PRD-103',
    name: 'Wireless Earbuds',
    categoryId: 'cat-audio',
    price: 8000,
    stock: 20, // in stock (20 > 5)
    lowStockThreshold: 5,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  const testState: InventoryState = {
    products: [p1, p2, p3],
    categories: [
      { id: 'cat-tablets', name: 'Tablets', isDefault: false },
      { id: 'cat-audio', name: 'Audio', isDefault: false },
      { id: 'cat-empty', name: 'Wearables', isDefault: false },
    ],
    history: [],
  };

  describe('selectStats', () => {
    it('returns zeros for an empty state', () => {
      const stats = selectStats({ products: [], categories: [], history: [] });
      expect(stats).toEqual({
        totalProducts: 0,
        totalInventoryValue: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        totalUnits: 0,
      });
    });

    it('computes accurate totals and values rounded to 2 decimals', () => {
      const stats = selectStats(testState);
      // Value calculation:
      // p1: 150000.50 * 0 = 0
      // p2: 12500.25 * 3 = 37500.75
      // p3: 8000 * 20 = 160000
      // Total value: 197500.75
      expect(stats.totalProducts).toBe(3);
      expect(stats.totalUnits).toBe(23); // 0 + 3 + 20
      expect(stats.outOfStockCount).toBe(1); // p1
      expect(stats.lowStockCount).toBe(1); // p2
      expect(stats.totalInventoryValue).toBe(197500.75);
    });
  });

  describe('selectCategoryCounts', () => {
    it('computes product counts and stock units per category including empty categories', () => {
      const counts = selectCategoryCounts(testState);
      expect(counts).toHaveLength(3);

      const tablets = counts.find((c) => c.categoryId === 'cat-tablets');
      expect(tablets?.count).toBe(1);
      expect(tablets?.stockUnits).toBe(0);

      const audio = counts.find((c) => c.categoryId === 'cat-audio');
      expect(audio?.count).toBe(2);
      expect(audio?.stockUnits).toBe(23);

      const empty = counts.find((c) => c.categoryId === 'cat-empty');
      expect(empty?.count).toBe(0);
      expect(empty?.stockUnits).toBe(0);
    });
  });

  describe('selectStockStatus', () => {
    it('returns out when stock is 0', () => {
      expect(selectStockStatus(p1)).toBe('out');
    });

    it('returns low when stock is positive but within lowStockThreshold', () => {
      expect(selectStockStatus(p2)).toBe('low');
    });

    it('returns in when stock exceeds lowStockThreshold', () => {
      expect(selectStockStatus(p3)).toBe('in');
    });
  });

  describe('selectFilteredProducts', () => {
    it('filters by search term matching product name case-insensitively', () => {
      const filtered = selectFilteredProducts(testState, {
        search: '  ipad  ',
        categoryId: 'all',
        stockStatus: 'all',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].productId).toBe('PRD-101');
    });

    it('filters by search term matching productId', () => {
      const filtered = selectFilteredProducts(testState, {
        search: 'prd-102',
        categoryId: 'all',
        stockStatus: 'all',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Bluetooth Speaker');
    });

    it('filters by categoryId', () => {
      const filtered = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'cat-audio',
        stockStatus: 'all',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.name)).toEqual(['Bluetooth Speaker', 'Wireless Earbuds']);
    });

    it('filters by stockStatus: in', () => {
      const filtered = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'all',
        stockStatus: 'in', // stock > 0 (includes low stock)
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.productId)).toEqual(['PRD-102', 'PRD-103']);
    });

    it('filters by stockStatus: out', () => {
      const filtered = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'all',
        stockStatus: 'out',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].productId).toBe('PRD-101');
    });

    it('filters by stockStatus: low', () => {
      const filtered = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'all',
        stockStatus: 'low',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].productId).toBe('PRD-102');
    });

    it('sorts by price in ascending and descending orders', () => {
      const asc = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'all',
        stockStatus: 'all',
        sortBy: 'price',
        sortOrder: 'asc',
      });
      expect(asc.map((p) => p.productId)).toEqual(['PRD-103', 'PRD-102', 'PRD-101']);

      const desc = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'all',
        stockStatus: 'all',
        sortBy: 'price',
        sortOrder: 'desc',
      });
      expect(desc.map((p) => p.productId)).toEqual(['PRD-101', 'PRD-102', 'PRD-103']);
    });

    it('sorts by updatedAt', () => {
      const sorted = selectFilteredProducts(testState, {
        search: '',
        categoryId: 'all',
        stockStatus: 'all',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      // Dates: p2=Jan 3, p3=Jan 2, p1=Jan 1
      expect(sorted.map((p) => p.productId)).toEqual(['PRD-102', 'PRD-103', 'PRD-101']);
    });
  });
});
