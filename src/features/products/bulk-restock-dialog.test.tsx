import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/lib/result';
import { InventoryContext, type InventoryContextValue } from '@/state/inventory-context';
import type { Product } from '@/types/product';

import { BulkRestockDialog } from './bulk-restock-dialog';

const products: Product[] = [
  {
    productId: 'PRD-100',
    name: 'Mouse',
    categoryId: 'cat-1',
    price: 3000,
    stock: 5,
    lowStockThreshold: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    productId: 'PRD-200',
    name: 'Keyboard',
    categoryId: 'cat-1',
    price: 6000,
    stock: 4,
    lowStockThreshold: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function renderDialog() {
  const context: InventoryContextValue = {
    state: { products, categories: [], history: [] },
    storageError: null,
    persistenceStatus: 'saved',
    retrySave: vi.fn(),
    addProduct: vi.fn(),
    editProduct: vi.fn(),
    removeProduct: vi.fn(),
    undoRemoveProduct: vi.fn(),
    adjustStock: vi.fn(),
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    removeCategory: vi.fn(),
    removeProducts: vi.fn(),
    restockProducts: vi.fn().mockReturnValue(ok(products)),
  };
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <InventoryContext.Provider value={context}>
      <BulkRestockDialog
        open={true}
        onOpenChange={onOpenChange}
        selectedProducts={products}
        onSuccess={onSuccess}
      />
    </InventoryContext.Provider>,
  );

  return { context, onOpenChange, onSuccess };
}

describe('BulkRestockDialog', () => {
  it('blocks an invalid quantity', async () => {
    renderDialog();

    const quantityInput = screen.getByLabelText('Quantity to Add to Each Product *');
    fireEvent.change(quantityInput, {
      target: { value: '0' },
    });
    fireEvent.blur(quantityInput);

    await waitFor(() => {
      expect(screen.getByText('Quantity must be at least 1')).toBeDefined();
    });
  });

  it('restocks every selected product with one validated submission', async () => {
    const { context, onOpenChange, onSuccess } = renderDialog();

    fireEvent.change(screen.getByLabelText('Quantity to Add to Each Product *'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Note / Reason (optional)'), {
      target: { value: '  Delivery  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Restock 2 Items' }));

    await waitFor(() => {
      expect(context.restockProducts).toHaveBeenCalledWith(['PRD-100', 'PRD-200'], 4, 'Delivery');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });
});
