import type { InventoryState } from '@/types/inventory';
import type { Product } from '@/types/product';
import { adjustStock, bulkRestock } from './stock-service';

describe('stock-service', () => {
  const existingProduct: Product = {
    productId: 'PRD-100',
    name: 'Wireless Mouse',
    categoryId: 'cat-1',
    price: 3500,
    stock: 10,
    lowStockThreshold: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const initialState: InventoryState = {
    products: [existingProduct],
    categories: [{ id: 'cat-1', name: 'Accessories', isDefault: true }],
    history: [],
  };

  describe('adjustStock', () => {
    it('restocks quantity successfully and creates a restock history entry', () => {
      const result = adjustStock(
        initialState,
        'PRD-100',
        {
          direction: 'increase',
          quantity: 15,
          note: 'Supplier shipment',
        },
        {
          timestamp: '2026-01-02T12:00:00.000Z',
          historyEntryId: 'hist-adjust-1',
        },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.stock).toBe(25);
        expect(result.data.product.updatedAt).toBe('2026-01-02T12:00:00.000Z');
        expect(result.data.historyEntry.type).toBe('restock');
        expect(result.data.historyEntry.change).toBe(15);
        expect(result.data.historyEntry.previousStock).toBe(10);
        expect(result.data.historyEntry.newStock).toBe(25);
        expect(result.data.historyEntry.note).toBe('Supplier shipment');
      }
    });

    it('records a sale and decreases stock', () => {
      const result = adjustStock(
        initialState,
        'PRD-100',
        {
          direction: 'decrease',
          quantity: 4,
          note: 'Walk-in customer',
        },
        {
          timestamp: '2026-01-02T12:00:00.000Z',
          historyEntryId: 'hist-adjust-2',
        },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.stock).toBe(6);
        expect(result.data.historyEntry.type).toBe('sale');
        expect(result.data.historyEntry.change).toBe(-4);
        expect(result.data.historyEntry.previousStock).toBe(10);
        expect(result.data.historyEntry.newStock).toBe(6);
      }
    });

    it('allows decreasing quantity equal to current stock (results in 0 stock)', () => {
      const result = adjustStock(
        initialState,
        'PRD-100',
        {
          direction: 'decrease',
          quantity: 10,
        },
        {
          timestamp: '2026-01-02T12:00:00.000Z',
          historyEntryId: 'hist-adjust-3',
        },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.product.stock).toBe(0);
        expect(result.data.historyEntry.newStock).toBe(0);
      }
    });

    it('fails with INSUFFICIENT_STOCK when decrease exceeds current stock', () => {
      const result = adjustStock(
        initialState,
        'PRD-100',
        {
          direction: 'decrease',
          quantity: 11, // stock is 10
        },
        {
          timestamp: '2026-01-02T12:00:00.000Z',
          historyEntryId: 'hist-adjust-4',
        },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INSUFFICIENT_STOCK');
        expect(result.error.message).toBe('Only 10 units in stock.');
      }
    });

    it('fails with NOT_FOUND when product does not exist', () => {
      const result = adjustStock(
        initialState,
        'PRD-MISSING',
        {
          direction: 'increase',
          quantity: 5,
        },
        {
          timestamp: '2026-01-02T12:00:00.000Z',
          historyEntryId: 'hist-adjust-5',
        },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('fails with VALIDATION_ERROR on non-positive or decimal quantities', () => {
      const zeroQty = adjustStock(
        initialState,
        'PRD-100',
        { direction: 'increase', quantity: 0 },
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h' },
      );
      expect(zeroQty.ok).toBe(false);
      if (!zeroQty.ok) expect(zeroQty.error.code).toBe('VALIDATION_ERROR');

      const decimalQty = adjustStock(
        initialState,
        'PRD-100',
        { direction: 'increase', quantity: 2.5 },
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h' },
      );
      expect(decimalQty.ok).toBe(false);
      if (!decimalQty.ok) expect(decimalQty.error.code).toBe('VALIDATION_ERROR');
    });

    it('fails with VALIDATION_ERROR if increase exceeds maximum stock ceiling', () => {
      const highStockProduct: Product = {
        ...existingProduct,
        stock: 999_999,
      };
      const result = adjustStock(
        { ...initialState, products: [highStockProduct] },
        'PRD-100',
        { direction: 'increase', quantity: 2 }, // 999,999 + 2 > 1,000,000
        { timestamp: '2026-01-02T00:00:00Z', historyEntryId: 'h' },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('bulkRestock', () => {
    it('restocks all requested products atomically', () => {
      const product2: Product = {
        ...existingProduct,
        productId: 'PRD-200',
        name: 'USB Hub',
        stock: 5,
      };
      const stateWithTwo: InventoryState = {
        ...initialState,
        products: [existingProduct, product2],
      };

      const result = bulkRestock(stateWithTwo, ['PRD-100', 'PRD-200'], 10, 'Bulk batch restock', {
        timestamp: '2026-01-02T10:00:00.000Z',
        historyEntryIds: {
          'PRD-100': 'hist-b-1',
          'PRD-200': 'hist-b-2',
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.products).toHaveLength(2);
        expect(result.data.products[0].stock).toBe(20);
        expect(result.data.products[1].stock).toBe(15);
        expect(result.data.historyEntries).toHaveLength(2);
      }
    });

    it('fails all-or-nothing with NOT_FOUND if any product in list is missing', () => {
      const result = bulkRestock(initialState, ['PRD-100', 'NON-EXISTENT-SKU'], 10, 'Note', {
        timestamp: '2026-01-02T00:00:00Z',
        historyEntryIds: {},
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });
  });
});
