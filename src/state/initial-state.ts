import { DEFAULT_CATEGORIES } from '@/constants/default-categories';
import { LIMITS } from '@/constants/limits';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { createId } from '@/lib/id';
import { readJSON } from '@/lib/storage';
import type { Category } from '@/types/category';
import type { MovementType, StockMovement } from '@/types/history';
import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import type { AppError } from '@/types/result';

/**
 * Creates default seed categories with unique IDs and `isDefault: true`.
 */
export function createDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((name) => ({
    id: createId(),
    name,
    isDefault: true,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasAtMostTwoDecimals(value: number): boolean {
  const str = String(value);
  const dot = str.indexOf('.');
  return dot === -1 || str.length - dot - 1 <= 2;
}

// ---------------------------------------------------------------------------
// Category validation
// ---------------------------------------------------------------------------

export function isValidCategory(item: unknown): item is Category {
  if (!isRecord(item)) return false;
  if (typeof item.id !== 'string' || item.id.trim().length === 0) return false;
  if (
    typeof item.name !== 'string' ||
    item.name.trim().length < LIMITS.categoryNameMin ||
    item.name.trim().length > LIMITS.categoryNameMax
  ) {
    return false;
  }
  if (typeof item.isDefault !== 'boolean') return false;
  return true;
}

export function isValidCategoryList(value: unknown): value is Category[] {
  if (!Array.isArray(value)) return false;
  if (!value.every(isValidCategory)) return false;

  const ids = new Set(value.map((c) => c.id));
  if (ids.size !== value.length) return false;

  const names = new Set(value.map((c) => c.name.trim().toLowerCase()));
  if (names.size !== value.length) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Product validation
// ---------------------------------------------------------------------------

export function isValidProduct(item: unknown): item is Product {
  if (!isRecord(item)) return false;

  if (
    typeof item.productId !== 'string' ||
    item.productId.length < LIMITS.productIdMin ||
    item.productId.length > LIMITS.productIdMax ||
    !/^[A-Z0-9-]+$/.test(item.productId)
  ) {
    return false;
  }

  if (
    typeof item.name !== 'string' ||
    item.name.trim().length < LIMITS.nameMin ||
    item.name.trim().length > LIMITS.nameMax
  ) {
    return false;
  }

  if (typeof item.categoryId !== 'string' || item.categoryId.trim().length === 0) {
    return false;
  }

  if (
    typeof item.price !== 'number' ||
    !Number.isFinite(item.price) ||
    item.price <= 0 ||
    item.price > LIMITS.priceMax ||
    !hasAtMostTwoDecimals(item.price)
  ) {
    return false;
  }

  if (
    typeof item.stock !== 'number' ||
    !Number.isInteger(item.stock) ||
    item.stock < 0 ||
    item.stock > LIMITS.stockMax
  ) {
    return false;
  }

  if (
    typeof item.lowStockThreshold !== 'number' ||
    !Number.isInteger(item.lowStockThreshold) ||
    item.lowStockThreshold < 0 ||
    item.lowStockThreshold > LIMITS.stockMax
  ) {
    return false;
  }

  if (typeof item.createdAt !== 'string' || Number.isNaN(Date.parse(item.createdAt))) {
    return false;
  }

  if (typeof item.updatedAt !== 'string' || Number.isNaN(Date.parse(item.updatedAt))) {
    return false;
  }

  return true;
}

export function isValidProductList(value: unknown): value is Product[] {
  if (!Array.isArray(value)) return false;
  if (!value.every(isValidProduct)) return false;

  const productIds = new Set(value.map((p) => p.productId.toUpperCase()));
  if (productIds.size !== value.length) return false;

  return true;
}

// ---------------------------------------------------------------------------
// History / StockMovement validation
// ---------------------------------------------------------------------------

const MOVEMENT_TYPES: Set<string> = new Set<MovementType>([
  'initial',
  'restock',
  'sale',
  'adjustment',
]);

export function isValidStockMovement(item: unknown): item is StockMovement {
  if (!isRecord(item)) return false;

  if (typeof item.id !== 'string' || item.id.trim().length === 0) return false;
  if (typeof item.productId !== 'string' || item.productId.trim().length === 0) {
    return false;
  }
  if (typeof item.productName !== 'string' || item.productName.trim().length === 0) {
    return false;
  }
  if (typeof item.type !== 'string' || !MOVEMENT_TYPES.has(item.type)) {
    return false;
  }
  if (typeof item.change !== 'number' || !Number.isInteger(item.change)) {
    return false;
  }
  if (
    typeof item.previousStock !== 'number' ||
    !Number.isInteger(item.previousStock) ||
    item.previousStock < 0
  ) {
    return false;
  }
  if (typeof item.newStock !== 'number' || !Number.isInteger(item.newStock) || item.newStock < 0) {
    return false;
  }
  if (item.newStock !== item.previousStock + item.change) return false;

  if (
    item.note !== undefined &&
    (typeof item.note !== 'string' || item.note.length > LIMITS.noteMax)
  ) {
    return false;
  }

  if (typeof item.timestamp !== 'string' || Number.isNaN(Date.parse(item.timestamp))) {
    return false;
  }

  return true;
}

export function isValidHistoryList(value: unknown): value is StockMovement[] {
  if (!Array.isArray(value)) return false;
  if (!value.every(isValidStockMovement)) return false;

  const ids = new Set(value.map((m) => m.id));
  if (ids.size !== value.length) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Theme validation
// ---------------------------------------------------------------------------

export function isValidTheme(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark';
}

// ---------------------------------------------------------------------------
// Initial state loader
// ---------------------------------------------------------------------------

export interface InitialStateResult {
  state: InventoryState;
  storageError: AppError | null;
}

/**
 * Loads inventory state from localStorage, validating full record shapes
 * and cross-record category references.
 *
 * - On first run (missing categories), seeds with default categories.
 * - On corrupted data, falls back safely to defaults and exposes the storage error.
 * - If a stored product references a category that does not exist, products fall back to []
 *   and an error is reported.
 * - Never throws.
 */
export function loadInitialState(): InitialStateResult {
  // 1. Categories
  const categoriesRead = readJSON<Category[]>(STORAGE_KEYS.categories, [], isValidCategoryList);

  let categories: Category[];
  let storageError: AppError | null = categoriesRead.error;

  if (categoriesRead.source === 'missing' || categoriesRead.data.length === 0) {
    categories = createDefaultCategories();
  } else {
    categories = categoriesRead.data;
  }

  // 2. Products
  const productsRead = readJSON<Product[]>(STORAGE_KEYS.products, [], isValidProductList);

  let products = productsRead.data;
  if (productsRead.error && !storageError) {
    storageError = productsRead.error;
  }

  // Cross-validation: each product must reference an existing category
  const validCategoryIds = new Set(categories.map((c) => c.id));
  const hasInvalidCategoryRef = products.some(
    (product) => !validCategoryIds.has(product.categoryId),
  );

  if (hasInvalidCategoryRef) {
    products = [];
    if (!storageError) {
      storageError = {
        code: 'STORAGE_ERROR',
        message: 'Saved data could not be loaded and has been replaced with defaults.',
      };
    }
  }

  // 3. History (can reference deleted products, so no category/product ref check is required)
  const historyRead = readJSON<StockMovement[]>(STORAGE_KEYS.history, [], isValidHistoryList);

  const history = historyRead.data;
  if (historyRead.error && !storageError) {
    storageError = historyRead.error;
  }

  return {
    state: {
      products,
      categories,
      history,
    },
    storageError,
  };
}
