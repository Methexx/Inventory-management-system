import type { InventoryState } from '@/types/inventory';
import type { InventoryAction } from './inventory-actions';

/**
 * Pure state reducer applying already-validated service results to the inventory state.
 * Never performs side-effects or mutations directly.
 */
export function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case 'PRODUCT_ADDED': {
      const { product, historyEntry } = action.payload;
      return {
        ...state,
        products: [...state.products, product],
        history: historyEntry ? [...state.history, historyEntry] : state.history,
      };
    }

    case 'PRODUCT_UPDATED': {
      const { product } = action.payload;
      const normalizedTargetId = product.productId.trim().toUpperCase();
      return {
        ...state,
        products: state.products.map((p) =>
          p.productId.trim().toUpperCase() === normalizedTargetId ? product : p,
        ),
      };
    }

    case 'PRODUCT_DELETED': {
      const normalizedTargetId = action.payload.productId.trim().toUpperCase();
      return {
        ...state,
        products: state.products.filter(
          (p) => p.productId.trim().toUpperCase() !== normalizedTargetId,
        ),
      };
    }

    case 'PRODUCT_RESTORED': {
      return {
        ...state,
        products: [...state.products, action.payload.product],
      };
    }

    case 'STOCK_ADJUSTED': {
      const { product, historyEntry } = action.payload;
      const normalizedTargetId = product.productId.trim().toUpperCase();
      return {
        ...state,
        products: state.products.map((p) =>
          p.productId.trim().toUpperCase() === normalizedTargetId ? product : p,
        ),
        history: [...state.history, historyEntry],
      };
    }

    case 'CATEGORY_ADDED': {
      return {
        ...state,
        categories: [...state.categories, action.payload.category],
      };
    }

    case 'CATEGORY_RENAMED': {
      const { category } = action.payload;
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === category.id ? category : c)),
      };
    }

    case 'CATEGORY_DELETED': {
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload.categoryId),
      };
    }

    case 'PRODUCTS_BULK_DELETED': {
      const toDeleteSet = new Set(action.payload.productIds.map((id) => id.trim().toUpperCase()));
      return {
        ...state,
        products: state.products.filter((p) => !toDeleteSet.has(p.productId.trim().toUpperCase())),
      };
    }

    case 'PRODUCTS_BULK_RESTOCKED': {
      const { products, historyEntries } = action.payload;
      const updatedMap = new Map(products.map((p) => [p.productId.trim().toUpperCase(), p]));
      return {
        ...state,
        products: state.products.map((p) => updatedMap.get(p.productId.trim().toUpperCase()) ?? p),
        history: [...state.history, ...historyEntries],
      };
    }

    case 'STATE_RESET': {
      return action.payload.state;
    }

    default:
      return state;
  }
}
