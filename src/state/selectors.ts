import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';

export type StockStatus = 'out' | 'low' | 'in';

export interface InventoryStats {
  totalProducts: number;
  totalInventoryValue: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalUnits: number;
}

export interface CategoryCount {
  categoryId: string;
  name: string;
  count: number;
  stockUnits: number;
}

export interface ProductFilters {
  search: string;
  categoryId: string | 'all';
  stockStatus: 'all' | 'in' | 'out' | 'low';
  sortBy: 'name' | 'productId' | 'price' | 'stock' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export function selectStats(state: InventoryState): InventoryStats {
  let totalInventoryValue = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  let totalUnits = 0;

  for (const product of state.products) {
    totalInventoryValue += product.price * product.stock;
    totalUnits += product.stock;

    if (product.stock === 0) {
      outOfStockCount += 1;
    } else if (product.stock <= product.lowStockThreshold) {
      lowStockCount += 1;
    }
  }

  return {
    totalProducts: state.products.length,
    totalInventoryValue: Math.round((totalInventoryValue + Number.EPSILON) * 100) / 100,
    outOfStockCount,
    lowStockCount,
    totalUnits,
  };
}

export function selectCategoryCounts(state: InventoryState): CategoryCount[] {
  return state.categories.map((category) => {
    let count = 0;
    let stockUnits = 0;

    for (const product of state.products) {
      if (product.categoryId === category.id) {
        count += 1;
        stockUnits += product.stock;
      }
    }

    return {
      categoryId: category.id,
      name: category.name,
      count,
      stockUnits,
    };
  });
}

export function selectStockStatus(product: Product): StockStatus {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.lowStockThreshold) return 'low';
  return 'in';
}

export function selectFilteredProducts(state: InventoryState, filters: ProductFilters): Product[] {
  const normalizedSearch = filters.search.trim().toLowerCase();

  const filtered = state.products.filter((product) => {
    if (normalizedSearch.length > 0) {
      const matchesName = product.name.toLowerCase().includes(normalizedSearch);
      const matchesId = product.productId.toLowerCase().includes(normalizedSearch);
      if (!matchesName && !matchesId) return false;
    }

    if (filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) {
      return false;
    }

    if (filters.stockStatus === 'in' && product.stock === 0) {
      return false;
    }
    if (filters.stockStatus === 'out' && product.stock !== 0) {
      return false;
    }
    if (
      filters.stockStatus === 'low' &&
      (product.stock === 0 || product.stock > product.lowStockThreshold)
    ) {
      return false;
    }

    return true;
  });

  const isAsc = filters.sortOrder === 'asc';

  return filtered.sort((a, b) => {
    let diff: number;

    switch (filters.sortBy) {
      case 'name':
        diff = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        break;
      case 'productId':
        diff = a.productId.localeCompare(b.productId, undefined, {
          sensitivity: 'base',
        });
        break;
      case 'price':
        diff = a.price - b.price;
        break;
      case 'stock':
        diff = a.stock - b.stock;
        break;
      case 'updatedAt':
        diff = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
        break;
      default:
        diff = 0;
    }

    return isAsc ? diff : -diff;
  });
}
