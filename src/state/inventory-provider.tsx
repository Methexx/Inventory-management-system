import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { createId } from '@/lib/id';
import { ok } from '@/lib/result';
import { writeJSON } from '@/lib/storage';
import { createCategory, deleteCategory, renameCategory } from '@/services/category-service';
import {
  createProduct,
  deleteProduct,
  restoreProduct,
  updateProduct,
} from '@/services/product-service';
import { adjustStock as serviceAdjustStock, bulkRestock } from '@/services/stock-service';
import type { Category } from '@/types/category';
import type { EditProductInput, NewProductInput, Product } from '@/types/product';
import type { AppError, Result } from '@/types/result';
import type { StockAdjustInput } from '@/types/stock';

import { loadInitialState } from './initial-state';
import {
  InventoryContext,
  type InventoryContextValue,
  type PersistenceStatus,
} from './inventory-context';
import { inventoryReducer } from './inventory-reducer';

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  // Load initial state lazily from localStorage
  const [{ state: initialState, storageError: initialStorageError }] = useState(() =>
    loadInitialState(),
  );

  const [state, dispatch] = useReducer(inventoryReducer, initialState);
  const stateRef = useRef(state);

  // Keep stateRef up to date across renders
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [storageError, setStorageError] = useState<AppError | null>(initialStorageError);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>('idle');
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Track mount status so initial hydration is skipped
  const isFirstMount = useRef(true);

  // Persistence effect: saves after mutations only
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    queueMicrotask(() => {
      setPersistenceStatus('pending');

      const productsWrite = writeJSON(STORAGE_KEYS.products, state.products);
      const categoriesWrite = writeJSON(STORAGE_KEYS.categories, state.categories);
      const historyWrite = writeJSON(STORAGE_KEYS.history, state.history);

      if (!productsWrite.ok) {
        setStorageError(productsWrite.error);
        setPersistenceStatus('error');
        return;
      }

      if (!categoriesWrite.ok) {
        setStorageError(categoriesWrite.error);
        setPersistenceStatus('error');
        return;
      }

      if (!historyWrite.ok) {
        setStorageError(historyWrite.error);
        setPersistenceStatus('error');
        return;
      }

      setStorageError(null);
      setPersistenceStatus('saved');
    });
  }, [state, saveTrigger]);

  const retrySave = useCallback(() => {
    setSaveTrigger((t) => t + 1);
  }, []);

  // -------------------------------------------------------------------------
  // Product actions
  // -------------------------------------------------------------------------

  const addProduct = useCallback((input: NewProductInput): Result<Product> => {
    const timestamp = new Date().toISOString();
    const historyEntryId = createId();

    const result = createProduct(stateRef.current, input, {
      timestamp,
      historyEntryId,
    });

    if (!result.ok) return result;

    const action = {
      type: 'PRODUCT_ADDED' as const,
      payload: {
        product: result.data.product,
        historyEntry: result.data.historyEntry,
      },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.product);
  }, []);

  const editProduct = useCallback((productId: string, input: EditProductInput): Result<Product> => {
    const timestamp = new Date().toISOString();
    const result = updateProduct(stateRef.current, productId, input, {
      timestamp,
    });

    if (!result.ok) return result;

    const action = {
      type: 'PRODUCT_UPDATED' as const,
      payload: { product: result.data.product },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.product);
  }, []);

  const removeProduct = useCallback((productId: string): Result<Product> => {
    const result = deleteProduct(stateRef.current, productId);
    if (!result.ok) return result;

    const action = {
      type: 'PRODUCT_DELETED' as const,
      payload: { productId },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.product);
  }, []);

  const undoRemoveProduct = useCallback((product: Product): Result<Product> => {
    const result = restoreProduct(stateRef.current, product);
    if (!result.ok) return result;

    const action = {
      type: 'PRODUCT_RESTORED' as const,
      payload: { product: result.data.product },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.product);
  }, []);

  const adjustStock = useCallback((productId: string, input: StockAdjustInput): Result<Product> => {
    const timestamp = new Date().toISOString();
    const historyEntryId = createId();

    const result = serviceAdjustStock(stateRef.current, productId, input, {
      timestamp,
      historyEntryId,
    });

    if (!result.ok) return result;

    const action = {
      type: 'STOCK_ADJUSTED' as const,
      payload: {
        product: result.data.product,
        historyEntry: result.data.historyEntry,
      },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.product);
  }, []);

  // -------------------------------------------------------------------------
  // Category actions
  // -------------------------------------------------------------------------

  const addCategory = useCallback((name: string): Result<Category> => {
    const categoryId = createId();
    const result = createCategory(stateRef.current, name, { categoryId });
    if (!result.ok) return result;

    const action = {
      type: 'CATEGORY_ADDED' as const,
      payload: { category: result.data.category },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.category);
  }, []);

  const renameCategoryAction = useCallback((id: string, name: string): Result<Category> => {
    const result = renameCategory(stateRef.current, id, name);
    if (!result.ok) return result;

    const action = {
      type: 'CATEGORY_RENAMED' as const,
      payload: { category: result.data.category },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(result.data.category);
  }, []);

  const removeCategoryAction = useCallback((id: string): Result<{ categoryId: string }> => {
    const result = deleteCategory(stateRef.current, id);
    if (!result.ok) return result;

    const action = {
      type: 'CATEGORY_DELETED' as const,
      payload: { categoryId: id },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok({ categoryId: id });
  }, []);

  // -------------------------------------------------------------------------
  // Bulk actions
  // -------------------------------------------------------------------------

  const removeProducts = useCallback((ids: string[]): Result<Product[]> => {
    const normalizedIds = new Set(ids.map((id) => id.trim().toUpperCase()));
    const removed = stateRef.current.products.filter((p) =>
      normalizedIds.has(p.productId.trim().toUpperCase()),
    );

    const action = {
      type: 'PRODUCTS_BULK_DELETED' as const,
      payload: { productIds: ids },
    };

    stateRef.current = inventoryReducer(stateRef.current, action);
    dispatch(action);

    return ok(removed);
  }, []);

  const restockProducts = useCallback(
    (ids: string[], quantity: number, note?: string): Result<Product[]> => {
      const timestamp = new Date().toISOString();
      const historyEntryIds: Record<string, string> = {};
      for (const id of ids) {
        historyEntryIds[id] = createId();
      }

      const result = bulkRestock(stateRef.current, ids, quantity, note, {
        timestamp,
        historyEntryIds,
      });

      if (!result.ok) return result;

      const action = {
        type: 'PRODUCTS_BULK_RESTOCKED' as const,
        payload: {
          products: result.data.products,
          historyEntries: result.data.historyEntries,
        },
      };

      stateRef.current = inventoryReducer(stateRef.current, action);
      dispatch(action);

      return ok(result.data.products);
    },
    [],
  );

  const value: InventoryContextValue = {
    state,
    storageError,
    persistenceStatus,
    retrySave,
    addProduct,
    editProduct,
    removeProduct,
    undoRemoveProduct,
    adjustStock,
    addCategory,
    renameCategory: renameCategoryAction,
    removeCategory: removeCategoryAction,
    removeProducts,
    restockProducts,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
