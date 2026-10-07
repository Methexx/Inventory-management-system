export type StockDirection = 'increase' | 'decrease';

export interface StockAdjustInput {
  direction: StockDirection;
  quantity: number;
  note?: string;
}
