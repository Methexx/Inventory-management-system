import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { Product } from '@/types/product';

import { InventoryProvider } from './inventory-provider';
import { useInventory } from './use-inventory';

const product: Product = {
  productId: 'PRD-100',
  name: 'Keyboard',
  categoryId: 'default-electronics',
  price: 5000,
  stock: 8,
  lowStockThreshold: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function BulkDeleteProbe() {
  const { state, removeProducts } = useInventory();

  return (
    <>
      <span data-testid="product-count">{state.products.length}</span>
      <button
        type="button"
        onClick={() => {
          removeProducts(['PRD-100', 'PRD-MISSING']);
        }}
      >
        Delete with stale selection
      </button>
    </>
  );
}

describe('InventoryProvider bulk deletion', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify([product]));
  });

  it('keeps every product when a selected ID is stale', () => {
    render(
      <InventoryProvider>
        <BulkDeleteProbe />
      </InventoryProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete with stale selection' }));

    expect(screen.getByTestId('product-count').textContent).toBe('1');
  });
});
