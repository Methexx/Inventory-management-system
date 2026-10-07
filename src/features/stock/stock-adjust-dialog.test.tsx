import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/lib/result';
import { InventoryContext, type InventoryContextValue } from '@/state/inventory-context';
import type { Product } from '@/types/product';

import { StockAdjustDialog } from './stock-adjust-dialog';

const mockProduct: Product = {
  productId: 'PRD-000100',
  name: 'Mechanical Keyboard',
  categoryId: 'cat-peripherals',
  price: 15000,
  stock: 10,
  lowStockThreshold: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithContext(ui: React.ReactElement, overrides?: Partial<InventoryContextValue>) {
  const defaultContext: InventoryContextValue = {
    state: {
      products: [mockProduct],
      categories: [],
      history: [],
    },
    storageError: null,
    persistenceStatus: 'saved',
    retrySave: vi.fn(),
    addProduct: vi.fn(),
    editProduct: vi.fn(),
    removeProduct: vi.fn(),
    undoRemoveProduct: vi.fn(),
    adjustStock: vi.fn().mockReturnValue(ok({ ...mockProduct, stock: 15 })),
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    removeCategory: vi.fn(),
    removeProducts: vi.fn(),
    restockProducts: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<InventoryContext.Provider value={defaultContext}>{ui}</InventoryContext.Provider>),
    mockContext: defaultContext,
  };
}

describe('StockAdjustDialog', () => {
  it('renders product details and current stock', () => {
    renderWithContext(
      <StockAdjustDialog open={true} onOpenChange={vi.fn()} product={mockProduct} />,
    );

    expect(screen.getByText('Adjust Stock')).toBeDefined();
    expect(screen.getByText(/Mechanical Keyboard/i)).toBeDefined();
    expect(screen.getByText(/PRD-000100/i)).toBeDefined();
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
  });

  it('calculates restock live preview correctly', async () => {
    renderWithContext(
      <StockAdjustDialog open={true} onOpenChange={vi.fn()} product={mockProduct} />,
    );

    const input = screen.getByLabelText(/Quantity/i);
    fireEvent.change(input, { target: { value: '5' } });

    // Current is 10, adding 5 gives 15
    await waitFor(() => {
      expect(screen.getByText('+5')).toBeDefined();
      expect(screen.getByText('15')).toBeDefined();
    });
  });

  it('calculates sale live preview and detects overselling', async () => {
    renderWithContext(
      <StockAdjustDialog open={true} onOpenChange={vi.fn()} product={mockProduct} />,
    );

    // Switch to sale / outbound
    const saleBtn = screen.getByText(/Sale \/ Outbound/i);
    fireEvent.click(saleBtn);

    const input = screen.getByLabelText(/Quantity/i);
    // Enter 15 when current stock is 10
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText(/Cannot dispense 15 units. Only 10 available/i)).toBeDefined();
    });
  });

  it('submits valid adjustment and triggers adjustStock callback', async () => {
    const adjustStockMock = vi.fn().mockReturnValue(ok({ ...mockProduct, stock: 15 }));
    const onOpenChange = vi.fn();

    renderWithContext(
      <StockAdjustDialog open={true} onOpenChange={onOpenChange} product={mockProduct} />,
      { adjustStock: adjustStockMock },
    );

    const input = screen.getByLabelText(/Quantity/i);
    fireEvent.change(input, { target: { value: '5' } });

    const submitBtn = screen.getByRole('button', { name: /Confirm Restock/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adjustStockMock).toHaveBeenCalledWith('PRD-000100', {
        direction: 'increase',
        quantity: 5,
        note: undefined,
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
