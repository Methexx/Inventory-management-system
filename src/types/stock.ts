export interface StockAdjustInput {
  direction: 'increase' | 'decrease';
  quantity: number;
  note?: string;
}
