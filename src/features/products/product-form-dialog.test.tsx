import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/lib/result';
import { InventoryContext, type InventoryContextValue } from '@/state/inventory-context';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { ProductFormDialog } from './product-form-dialog';

const category: Category = { id: 'cat-electronics', name: 'Electronics', isDefault: true };

const product: Product = {
  productId: 'PRD-123456',
  name: 'Wireless Mouse',
  categoryId: category.id,
  price: 3500,
  stock: 8,
  lowStockThreshold: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderForm(overrides?: Partial<InventoryContextValue>) {
  const context: InventoryContextValue = {
    state: { products: [], categories: [category], history: [] },
    storageError: null,
    persistenceStatus: 'saved',
    retrySave: vi.fn(),
    addProduct: vi.fn().mockReturnValue(ok(product)),
    editProduct: vi.fn(),
    removeProduct: vi.fn(),
    undoRemoveProduct: vi.fn(),
    adjustStock: vi.fn(),
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    removeCategory: vi.fn(),
    removeProducts: vi.fn(),
    restockProducts: vi.fn(),
    ...overrides,
  };

  const onOpenChange = vi.fn();

  render(
    <InventoryContext.Provider value={context}>
      <ProductFormDialog open={true} onOpenChange={onOpenChange} categories={[category]} />
    </InventoryContext.Provider>,
  );

  return { context, onOpenChange };
}

describe('ProductFormDialog', () => {
  it('shows Formik validation errors for incomplete product details', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Create Product' }));

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeDefined();
      expect(screen.getByText('Price is required')).toBeDefined();
    });
  });

  it('normalizes submitted data and creates a product', async () => {
    const { context, onOpenChange } = renderForm();

    fireEvent.change(screen.getByLabelText('Product Name *'), {
      target: { value: '  Wireless Mouse  ' },
    });
    fireEvent.change(screen.getByLabelText('Product ID (SKU) *'), {
      target: { value: 'prd-123456' },
    });
    fireEvent.change(screen.getByLabelText('Price (LKR) *'), { target: { value: '3500' } });
    fireEvent.change(screen.getByLabelText('Initial Stock *'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Low Stock Alert Threshold'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Product' }));

    await waitFor(() => {
      expect(context.addProduct).toHaveBeenCalledWith({
        name: 'Wireless Mouse',
        productId: 'PRD-123456',
        categoryId: 'cat-electronics',
        price: 3500,
        stock: 8,
        lowStockThreshold: 2,
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
