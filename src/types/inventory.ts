import type { Category } from './category';
import type { StockMovement } from './history';
import type { Product } from './product';

export interface InventoryState {
  products: Product[];
  categories: Category[];
  history: StockMovement[];
}
