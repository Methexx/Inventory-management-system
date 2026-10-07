import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/lib/result';
import { InventoryContext, type InventoryContextValue } from '@/state/inventory-context';
import type { Category } from '@/types/category';

import { CategoryFormDialog } from './category-form-dialog';

const category: Category = { id: 'cat-office', name: 'Office', isDefault: false };

function renderForm(overrides?: Partial<InventoryContextValue>) {
  const context: InventoryContextValue = {
    state: { products: [], categories: [], history: [] },
    storageError: null,
    persistenceStatus: 'saved',
    retrySave: vi.fn(),
    addProduct: vi.fn(),
    editProduct: vi.fn(),
    removeProduct: vi.fn(),
    undoRemoveProduct: vi.fn(),
    adjustStock: vi.fn(),
    addCategory: vi.fn().mockReturnValue(ok(category)),
    renameCategory: vi.fn(),
    removeCategory: vi.fn(),
    removeProducts: vi.fn(),
    restockProducts: vi.fn(),
    ...overrides,
  };

  const onOpenChange = vi.fn();
  const onCreated = vi.fn();

  render(
    <InventoryContext.Provider value={context}>
      <CategoryFormDialog open={true} onOpenChange={onOpenChange} onCreated={onCreated} />
    </InventoryContext.Provider>,
  );

  return { context, onCreated, onOpenChange };
}

describe('CategoryFormDialog', () => {
  it('validates the category name before submission', async () => {
    renderForm();

    const input = screen.getByLabelText('Category Name *');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Category name must be at least 2 characters')).toBeDefined();
    });
  });

  it('trims a valid name and reports the new category', async () => {
    const { context, onCreated, onOpenChange } = renderForm();

    fireEvent.change(screen.getByLabelText('Category Name *'), {
      target: { value: '  Office  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));

    await waitFor(() => {
      expect(context.addCategory).toHaveBeenCalledWith('Office');
      expect(onCreated).toHaveBeenCalledWith(category);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
