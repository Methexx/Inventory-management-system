import type { Category } from '@/types/category';
import type { StockMovement } from '@/types/history';
import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';

export type InventoryAction =
  | {
      type: 'PRODUCT_ADDED';
      payload: { product: Product; historyEntry: StockMovement | null };
    }
  | {
      type: 'PRODUCT_UPDATED';
      payload: { product: Product };
    }
  | {
      type: 'PRODUCT_DELETED';
      payload: { productId: string };
    }
  | {
      type: 'PRODUCT_RESTORED';
      payload: { product: Product };
    }
  | {
      type: 'STOCK_ADJUSTED';
      payload: { product: Product; historyEntry: StockMovement };
    }
  | {
      type: 'CATEGORY_ADDED';
      payload: { category: Category };
    }
  | {
      type: 'CATEGORY_RENAMED';
      payload: { category: Category };
    }
  | {
      type: 'CATEGORY_DELETED';
      payload: { categoryId: string };
    }
  | {
      type: 'PRODUCTS_BULK_DELETED';
      payload: { productIds: string[] };
    }
  | {
      type: 'PRODUCTS_BULK_RESTOCKED';
      payload: { products: Product[]; historyEntries: StockMovement[] };
    }
  | {
      type: 'STATE_RESET';
      payload: { state: InventoryState };
    };
