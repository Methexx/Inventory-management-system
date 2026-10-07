import { createContext } from 'react';

import type { Category } from '@/types/category';
import type { InventoryState } from '@/types/inventory';
import type { EditProductInput, NewProductInput, Product } from '@/types/product';
import type { AppError, Result } from '@/types/result';
import type { StockAdjustInput } from '@/types/stock';

export type PersistenceStatus = 'idle' | 'pending' | 'saved' | 'error';

export interface InventoryContextValue {
  state: InventoryState;
  storageError: AppError | null;
  persistenceStatus: PersistenceStatus;
  retrySave(): void;
  addProduct(input: NewProductInput): Result<Product>;
  editProduct(productId: string, input: EditProductInput): Result<Product>;
  removeProduct(productId: string): Result<Product>;
  undoRemoveProduct(product: Product): Result<Product>;
  adjustStock(productId: string, input: StockAdjustInput): Result<Product>;
  addCategory(name: string): Result<Category>;
  renameCategory(id: string, name: string): Result<Category>;
  removeCategory(id: string): Result<{ categoryId: string }>;
  removeProducts(ids: string[]): Result<Product[]>;
  restockProducts(ids: string[], quantity: number, note?: string): Result<Product[]>;
}

export const InventoryContext = createContext<InventoryContextValue | null>(null);
