export type MovementType = 'initial' | 'restock' | 'sale' | 'adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  change: number;
  previousStock: number;
  newStock: number;
  note?: string;
  timestamp: string;
}
