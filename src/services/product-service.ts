import { LIMITS } from '@/constants/limits';
import { fail, ok } from '@/lib/result';
import type { StockMovement } from '@/types/history';
import type { InventoryState } from '@/types/inventory';
import type { EditProductInput, NewProductInput, Product } from '@/types/product';
import type { Result } from '@/types/result';

function hasAtMostTwoDecimals(value: number): boolean {
  const str = String(value);
  const dot = str.indexOf('.');
  return dot === -1 || str.length - dot - 1 <= 2;
}

export interface CreateProductMetadata {
  timestamp: string;
  historyEntryId: string;
}

export interface UpdateProductMetadata {
  timestamp: string;
}

export function createProduct(
  state: InventoryState,
  input: NewProductInput,
  metadata: CreateProductMetadata,
): Result<{ product: Product; historyEntry: StockMovement | null }> {
  const normalizedId = input.productId.trim().toUpperCase();
  const trimmedName = input.name.trim();

  const isDuplicateId = state.products.some(
    (p) => p.productId.trim().toUpperCase() === normalizedId,
  );
  if (isDuplicateId) {
    return fail('DUPLICATE_PRODUCT_ID', 'A product with this ID already exists.');
  }

  const categoryExists = state.categories.some((c) => c.id === input.categoryId);
  if (!categoryExists) {
    return fail('CATEGORY_NOT_FOUND', 'This category no longer exists.');
  }

  if (trimmedName.length < LIMITS.nameMin || trimmedName.length > LIMITS.nameMax) {
    return fail(
      'VALIDATION_ERROR',
      `Name must be between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters.`,
    );
  }

  if (
    normalizedId.length < LIMITS.productIdMin ||
    normalizedId.length > LIMITS.productIdMax ||
    !/^[A-Z0-9-]+$/.test(normalizedId)
  ) {
    return fail('VALIDATION_ERROR', 'Use letters, numbers and dashes only for Product ID.');
  }

  if (
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    input.price > LIMITS.priceMax ||
    !hasAtMostTwoDecimals(input.price)
  ) {
    return fail(
      'VALIDATION_ERROR',
      'Price must be greater than 0 and have at most 2 decimal places.',
    );
  }

  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > LIMITS.stockMax) {
    return fail('VALIDATION_ERROR', 'Stock must be a valid whole number.');
  }

  if (
    !Number.isInteger(input.lowStockThreshold) ||
    input.lowStockThreshold < 0 ||
    input.lowStockThreshold > LIMITS.stockMax
  ) {
    return fail('VALIDATION_ERROR', 'Low stock threshold must be a valid whole number.');
  }

  const product: Product = {
    productId: normalizedId,
    name: trimmedName,
    categoryId: input.categoryId,
    price: input.price,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold,
    createdAt: metadata.timestamp,
    updatedAt: metadata.timestamp,
  };

  const historyEntry: StockMovement | null =
    input.stock > 0
      ? {
          id: metadata.historyEntryId,
          productId: normalizedId,
          productName: trimmedName,
          type: 'initial',
          change: input.stock,
          previousStock: 0,
          newStock: input.stock,
          timestamp: metadata.timestamp,
        }
      : null;

  return ok({ product, historyEntry });
}

export function updateProduct(
  state: InventoryState,
  productId: string,
  input: EditProductInput,
  metadata: UpdateProductMetadata,
): Result<{ product: Product }> {
  const normalizedId = productId.trim().toUpperCase();

  const existingProduct = state.products.find(
    (p) => p.productId.trim().toUpperCase() === normalizedId,
  );
  if (!existingProduct) {
    return fail('NOT_FOUND', 'This product no longer exists.');
  }

  const categoryExists = state.categories.some((c) => c.id === input.categoryId);
  if (!categoryExists) {
    return fail('CATEGORY_NOT_FOUND', 'This category no longer exists.');
  }

  const trimmedName = input.name.trim();
  if (trimmedName.length < LIMITS.nameMin || trimmedName.length > LIMITS.nameMax) {
    return fail(
      'VALIDATION_ERROR',
      `Name must be between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters.`,
    );
  }

  if (
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    input.price > LIMITS.priceMax ||
    !hasAtMostTwoDecimals(input.price)
  ) {
    return fail(
      'VALIDATION_ERROR',
      'Price must be greater than 0 and have at most 2 decimal places.',
    );
  }

  if (
    !Number.isInteger(input.lowStockThreshold) ||
    input.lowStockThreshold < 0 ||
    input.lowStockThreshold > LIMITS.stockMax
  ) {
    return fail('VALIDATION_ERROR', 'Low stock threshold must be a valid whole number.');
  }

  const updatedProduct: Product = {
    ...existingProduct,
    name: trimmedName,
    categoryId: input.categoryId,
    price: input.price,
    lowStockThreshold: input.lowStockThreshold,
    updatedAt: metadata.timestamp,
  };

  return ok({ product: updatedProduct });
}

export function deleteProduct(
  state: InventoryState,
  productId: string,
): Result<{ product: Product }> {
  const normalizedId = productId.trim().toUpperCase();

  const existingProduct = state.products.find(
    (p) => p.productId.trim().toUpperCase() === normalizedId,
  );
  if (!existingProduct) {
    return fail('NOT_FOUND', 'This product no longer exists.');
  }

  return ok({ product: existingProduct });
}

export function restoreProduct(
  state: InventoryState,
  product: Product,
): Result<{ product: Product }> {
  const normalizedId = product.productId.trim().toUpperCase();

  const isDuplicateId = state.products.some(
    (p) => p.productId.trim().toUpperCase() === normalizedId,
  );
  if (isDuplicateId) {
    return fail('DUPLICATE_PRODUCT_ID', 'A product with this ID already exists.');
  }

  const categoryExists = state.categories.some((c) => c.id === product.categoryId);
  if (!categoryExists) {
    return fail('CATEGORY_NOT_FOUND', 'This category no longer exists.');
  }

  return ok({
    product: {
      ...product,
      productId: normalizedId,
    },
  });
}
