import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { HistoryPage } from '@/pages/history-page';
import { InventoryProvider } from '@/state/inventory-provider';
import { useInventory } from '@/state/use-inventory';
import type { Product } from '@/types/product';

import { ProductFormDialog } from './product-form-dialog';

const product: Product = {
  productId: 'PRD-123456',
  name: 'Wireless Mouse',
  categoryId: 'default-electronics',
  price: 3500,
  stock: 8,
  lowStockThreshold: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function ProductHistoryFlow() {
  const { state } = useInventory();
  const [open, setOpen] = useState(true);
  return (
    <>
      <ProductFormDialog open={open} onOpenChange={setOpen} categories={state.categories} />
      <HistoryPage />
    </>
  );
}

describe('Product form stock history', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify([product]));
    localStorage.setItem(
      STORAGE_KEYS.history,
      JSON.stringify([
        {
          id: 'initial-1',
          productId: product.productId,
          productName: product.name,
          type: 'initial',
          change: 8,
          previousStock: 0,
          newStock: 8,
          timestamp: product.createdAt,
        },
      ]),
    );
  });

  afterEach(() => localStorage.clear());

  it.each([12, 3, 0])(
    'persists a stock total of %s and a visible adjustment record',
    async (stock) => {
      const user = userEvent.setup();
      const { unmount } = render(
        <InventoryProvider>
          <ProductHistoryFlow />
        </InventoryProvider>,
      );
      await user.type(screen.getByLabelText('Product Name *'), 'mou');
      await user.click(
        within(screen.getByRole('listbox')).getByRole('option', { name: /Wireless Mouse/ }),
      );
      fireEvent.change(screen.getByLabelText('Current Stock'), {
        target: { value: String(stock) },
      });
      fireEvent.change(screen.getByLabelText('Product Name *'), {
        target: { value: 'Updated Mouse' },
      });
      fireEvent.change(screen.getByLabelText('Price (LKR) *'), { target: { value: '4000' } });
      await user.click(screen.getByRole('button', { name: 'Update Product' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
        const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.products)!);
        expect(products).toHaveLength(1);
        expect(products[0]).toMatchObject({
          productId: product.productId,
          name: 'Updated Mouse',
          price: 4000,
          stock,
        });
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!);
        expect(history).toHaveLength(2);
        expect(history[1]).toMatchObject({
          productId: product.productId,
          productName: 'Updated Mouse',
          type: 'adjustment',
          change: stock - 8,
          previousStock: 8,
          newStock: stock,
        });
        expect(history[1].id).toBeTruthy();
        expect(Number.isNaN(Date.parse(history[1].timestamp))).toBe(false);
      });

      await user.selectOptions(screen.getByLabelText('Filter by movement type'), 'adjustment');
      const table = within(screen.getByRole('table'));
      expect(table.getAllByRole('row')).toHaveLength(2);
      expect(table.getByText('Adjustment')).toBeDefined();
      expect(table.getByText('Updated Mouse')).toBeDefined();
      expect(table.getByText(stock > 8 ? `+${stock - 8}` : String(stock - 8))).toBeDefined();

      unmount();
      render(
        <InventoryProvider>
          <HistoryPage />
        </InventoryProvider>,
      );
      expect(within(screen.getByRole('table')).getByText('Adjustment')).toBeDefined();
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
    },
  );

  it('saves detail-only edits without adding a stock history entry', async () => {
    const user = userEvent.setup();
    render(
      <InventoryProvider>
        <ProductHistoryFlow />
      </InventoryProvider>,
    );
    await user.type(screen.getByLabelText('Product Name *'), 'mou');
    await user.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: /Wireless Mouse/ }),
    );
    fireEvent.change(screen.getByLabelText('Price (LKR) *'), { target: { value: '4000' } });
    await user.click(screen.getByRole('button', { name: 'Update Product' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.products)!)[0]).toMatchObject({
        price: 4000,
        stock: 8,
      });
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!)).toHaveLength(1);
    });
  });
});
