import { LIMITS } from '@/constants/limits';
import { fail, ok } from '@/lib/result';
import type { MovementType, StockMovement } from '@/types/history';
import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import type { Result } from '@/types/result';
import type { StockAdjustInput } from '@/types/stock';

export interface AdjustStockMetadata {
  timestamp: string;
  historyEntryId: string;
}

export interface BulkRestockMetadata {
  timestamp: string;
  historyEntryIds: Record<string, string>;
}

/**
 * Adjusts a single product's stock (restock or sale).
 *
 * Rules:
 * - Product must exist.
 * - Quantity must be an integer >= 1 and <= LIMITS.stockMax.
 * - Decrease cannot exceed current stock (blocks overselling, stock never < 0).
 * - Increase cannot cause stock to exceed LIMITS.stockMax.
 * - Records a signed StockMovement audit entry ('restock' or 'sale').
 * - Refreshes product `updatedAt` to metadata timestamp.
 */
export function adjustStock(
  state: InventoryState,
  productId: string,
  input: StockAdjustInput,
  metadata: AdjustStockMetadata,
): Result<{ product: Product; historyEntry: StockMovement }> {
  const normalizedId = productId.trim().toUpperCase();

  const product = state.products.find((p) => p.productId.trim().toUpperCase() === normalizedId);
  if (!product) {
    return fail('NOT_FOUND', 'This product no longer exists.');
  }

  if (input.direction !== 'increase' && input.direction !== 'decrease') {
    return fail('VALIDATION_ERROR', 'Direction must be either increase or decrease.');
  }

  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > LIMITS.stockMax) {
    return fail(
      'VALIDATION_ERROR',
      `Quantity must be a whole number between 1 and ${LIMITS.stockMax.toLocaleString()}.`,
    );
  }

  if (input.note && input.note.length > LIMITS.noteMax) {
    return fail('VALIDATION_ERROR', `Note cannot exceed ${LIMITS.noteMax} characters.`);
  }

  if (input.direction === 'decrease' && input.quantity > product.stock) {
    return fail('INSUFFICIENT_STOCK', `Only ${product.stock} units in stock.`);
  }

  if (input.direction === 'increase' && product.stock + input.quantity > LIMITS.stockMax) {
    return fail('VALIDATION_ERROR', `Stock cannot exceed ${LIMITS.stockMax.toLocaleString()}.`);
  }

  const isIncrease = input.direction === 'increase';
  const newStock = isIncrease ? product.stock + input.quantity : product.stock - input.quantity;
  const change = isIncrease ? input.quantity : -input.quantity;
  const type: MovementType = isIncrease ? 'restock' : 'sale';

  const updatedProduct: Product = {
    ...product,
    stock: newStock,
    updatedAt: metadata.timestamp,
  };

  const historyEntry: StockMovement = {
    id: metadata.historyEntryId,
    productId: product.productId,
    productName: product.name,
    type,
    change,
    previousStock: product.stock,
    newStock,
    note: input.note ? input.note.trim() : undefined,
    timestamp: metadata.timestamp,
  };

  return ok({ product: updatedProduct, historyEntry });
}

/**
 * Bulk restocks multiple products simultaneously.
 *
 * Rules:
 * - All-or-nothing: if any product ID is missing, nothing is modified.
 * - Deduplicates incoming product IDs.
 * - Quantity must be an integer >= 1.
 * - Validates each product will not exceed LIMITS.stockMax.
 * - Generates history entries for each restocked product.
 */
export function bulkRestock(
  state: InventoryState,
  productIds: string[],
  quantity: number,
  note: string | undefined,
  metadata: BulkRestockMetadata,
): Result<{ products: Product[]; historyEntries: StockMovement[] }> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.stockMax) {
    return fail(
      'VALIDATION_ERROR',
      `Quantity must be a whole number between 1 and ${LIMITS.stockMax.toLocaleString()}.`,
    );
  }

  if (note && note.length > LIMITS.noteMax) {
    return fail('VALIDATION_ERROR', `Note cannot exceed ${LIMITS.noteMax} characters.`);
  }

  // Deduplicate candidate IDs
  const uniqueIds = Array.from(new Set(productIds.map((id) => id.trim().toUpperCase())));

  const matchedProducts: Product[] = [];
  for (const id of uniqueIds) {
    const found = state.products.find((p) => p.productId.trim().toUpperCase() === id);
    if (!found) {
      return fail('NOT_FOUND', 'This product no longer exists.');
    }
    if (found.stock + quantity > LIMITS.stockMax) {
      return fail('VALIDATION_ERROR', `Stock cannot exceed ${LIMITS.stockMax.toLocaleString()}.`);
    }
    matchedProducts.push(found);
  }

  const updatedProducts: Product[] = [];
  const historyEntries: StockMovement[] = [];

  for (const product of matchedProducts) {
    const newStock = product.stock + quantity;
    const historyId =
      metadata.historyEntryIds[product.productId] ||
      metadata.historyEntryIds[product.productId.toUpperCase()] ||
      `hist-${product.productId}-${Date.now()}`;

    updatedProducts.push({
      ...product,
      stock: newStock,
      updatedAt: metadata.timestamp,
    });

    historyEntries.push({
      id: historyId,
      productId: product.productId,
      productName: product.name,
      type: 'restock',
      change: quantity,
      previousStock: product.stock,
      newStock,
      note: note ? note.trim() : undefined,
      timestamp: metadata.timestamp,
    });
  }

  return ok({ products: updatedProducts, historyEntries });
}
