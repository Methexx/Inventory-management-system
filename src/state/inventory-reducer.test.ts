import type { Category } from '@/types/category';
import type { StockMovement } from '@/types/history';
import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import { inventoryReducer } from './inventory-reducer';

describe('inventoryReducer', () => {
  const initialCategory: Category = {
    id: 'cat-1',
    name: 'Electronics',
    isDefault: true,
  };

  const initialProduct: Product = {
    productId: 'PRD-100',
    name: 'Laptop Stand',
    categoryId: 'cat-1',
    price: 4500,
    stock: 10,
    lowStockThreshold: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const initialHistory: StockMovement = {
    id: 'hist-1',
    productId: 'PRD-100',
    productName: 'Laptop Stand',
    type: 'initial',
    change: 10,
    previousStock: 0,
    newStock: 10,
    timestamp: '2026-01-01T00:00:00.000Z',
  };

  const baseState: InventoryState = {
    products: [initialProduct],
    categories: [initialCategory],
    history: [initialHistory],
  };

  it('handles PRODUCT_ADDED with a history entry', () => {
    const newProduct: Product = {
      ...initialProduct,
      productId: 'PRD-200',
      name: 'Mousepad',
    };
    const movement: StockMovement = {
      id: 'hist-2',
      productId: 'PRD-200',
      productName: 'Mousepad',
      type: 'initial',
      change: 10,
      previousStock: 0,
      newStock: 10,
      timestamp: '2026-01-02T00:00:00.000Z',
    };

    const nextState = inventoryReducer(baseState, {
      type: 'PRODUCT_ADDED',
      payload: { product: newProduct, historyEntry: movement },
    });

    expect(nextState.products).toHaveLength(2);
    expect(nextState.history).toHaveLength(2);
    expect(nextState.products[1].productId).toBe('PRD-200');
  });

  it('handles PRODUCT_ADDED without a history entry (0 stock)', () => {
    const zeroStockProduct: Product = {
      ...initialProduct,
      productId: 'PRD-300',
      stock: 0,
    };

    const nextState = inventoryReducer(baseState, {
      type: 'PRODUCT_ADDED',
      payload: { product: zeroStockProduct, historyEntry: null },
    });

    expect(nextState.products).toHaveLength(2);
    expect(nextState.history).toHaveLength(1); // no new movement
  });

  it('handles PRODUCT_UPDATED by replacing the matching product', () => {
    const updated = {
      ...initialProduct,
      name: 'Ergonomic Laptop Stand',
      price: 5200,
    };

    const nextState = inventoryReducer(baseState, {
      type: 'PRODUCT_UPDATED',
      payload: { product: updated },
    });

    expect(nextState.products).toHaveLength(1);
    expect(nextState.products[0].name).toBe('Ergonomic Laptop Stand');
    expect(nextState.products[0].price).toBe(5200);
  });

  it('handles PRODUCT_DELETED by removing product and keeping history', () => {
    const nextState = inventoryReducer(baseState, {
      type: 'PRODUCT_DELETED',
      payload: { productId: 'PRD-100' },
    });

    expect(nextState.products).toHaveLength(0);
    expect(nextState.history).toHaveLength(1); // history is preserved
  });

  it('handles PRODUCT_RESTORED by adding back the deleted product', () => {
    const emptyState = { ...baseState, products: [] };
    const nextState = inventoryReducer(emptyState, {
      type: 'PRODUCT_RESTORED',
      payload: { product: initialProduct },
    });

    expect(nextState.products).toHaveLength(1);
    expect(nextState.products[0].productId).toBe('PRD-100');
  });

  it('handles STOCK_ADJUSTED by updating product and appending movement', () => {
    const adjustedProduct = { ...initialProduct, stock: 15 };
    const adjustmentEntry: StockMovement = {
      id: 'hist-adj-1',
      productId: 'PRD-100',
      productName: 'Laptop Stand',
      type: 'restock',
      change: 5,
      previousStock: 10,
      newStock: 15,
      timestamp: '2026-01-03T00:00:00.000Z',
    };

    const nextState = inventoryReducer(baseState, {
      type: 'STOCK_ADJUSTED',
      payload: { product: adjustedProduct, historyEntry: adjustmentEntry },
    });

    expect(nextState.products[0].stock).toBe(15);
    expect(nextState.history).toHaveLength(2);
    expect(nextState.history[1].id).toBe('hist-adj-1');
  });

  it('handles CATEGORY_ADDED', () => {
    const newCat: Category = { id: 'cat-2', name: 'Office', isDefault: false };
    const nextState = inventoryReducer(baseState, {
      type: 'CATEGORY_ADDED',
      payload: { category: newCat },
    });

    expect(nextState.categories).toHaveLength(2);
    expect(nextState.categories[1].name).toBe('Office');
  });

  it('handles CATEGORY_RENAMED', () => {
    const renamedCat: Category = {
      id: 'cat-1',
      name: 'Consumer Electronics',
      isDefault: true,
    };
    const nextState = inventoryReducer(baseState, {
      type: 'CATEGORY_RENAMED',
      payload: { category: renamedCat },
    });

    expect(nextState.categories).toHaveLength(1);
    expect(nextState.categories[0].name).toBe('Consumer Electronics');
  });

  it('handles CATEGORY_DELETED', () => {
    const nextState = inventoryReducer(baseState, {
      type: 'CATEGORY_DELETED',
      payload: { categoryId: 'cat-1' },
    });

    expect(nextState.categories).toHaveLength(0);
  });

  it('handles PRODUCTS_BULK_DELETED', () => {
    const product2 = { ...initialProduct, productId: 'PRD-200' };
    const product3 = { ...initialProduct, productId: 'PRD-300' };
    const stateWithThree = {
      ...baseState,
      products: [initialProduct, product2, product3],
    };

    const nextState = inventoryReducer(stateWithThree, {
      type: 'PRODUCTS_BULK_DELETED',
      payload: { productIds: ['PRD-100', 'PRD-300'] },
    });

    expect(nextState.products).toHaveLength(1);
    expect(nextState.products[0].productId).toBe('PRD-200');
  });

  it('handles PRODUCTS_BULK_RESTOCKED', () => {
    const product2 = { ...initialProduct, productId: 'PRD-200', stock: 5 };
    const stateWithTwo = {
      ...baseState,
      products: [initialProduct, product2],
    };

    const updatedP1 = { ...initialProduct, stock: 20 };
    const updatedP2 = { ...product2, stock: 15 };
    const movement1: StockMovement = {
      id: 'h-b-1',
      productId: 'PRD-100',
      productName: 'Laptop Stand',
      type: 'restock',
      change: 10,
      previousStock: 10,
      newStock: 20,
      timestamp: '2026-01-02T00:00:00Z',
    };
    const movement2: StockMovement = {
      id: 'h-b-2',
      productId: 'PRD-200',
      productName: 'Laptop Stand',
      type: 'restock',
      change: 10,
      previousStock: 5,
      newStock: 15,
      timestamp: '2026-01-02T00:00:00Z',
    };

    const nextState = inventoryReducer(stateWithTwo, {
      type: 'PRODUCTS_BULK_RESTOCKED',
      payload: {
        products: [updatedP1, updatedP2],
        historyEntries: [movement1, movement2],
      },
    });

    expect(nextState.products[0].stock).toBe(20);
    expect(nextState.products[1].stock).toBe(15);
    expect(nextState.history).toHaveLength(3);
  });

  it('handles STATE_RESET', () => {
    const freshState: InventoryState = {
      products: [],
      categories: [],
      history: [],
    };
    const nextState = inventoryReducer(baseState, {
      type: 'STATE_RESET',
      payload: { state: freshState },
    });

    expect(nextState.products).toEqual([]);
    expect(nextState.categories).toEqual([]);
  });
});
