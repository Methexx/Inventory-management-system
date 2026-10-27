import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    editProduct: vi.fn().mockReturnValue(ok(product)),
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

  const renderDialog = (open: boolean) => (
    <InventoryContext.Provider value={context}>
      <ProductFormDialog
        open={open}
        onOpenChange={onOpenChange}
        categories={context.state.categories}
      />
    </InventoryContext.Provider>
  );
  const { rerender } = render(renderDialog(true));

  return { context, onOpenChange, setOpen: (open: boolean) => rerender(renderDialog(open)) };
}

describe('ProductFormDialog', () => {
  it('searches from the third character and updates matches on every keystroke', async () => {
    const user = userEvent.setup();
    renderForm({
      state: {
        products: [product, { ...product, productId: 'PRD-654321', name: 'Wired Keyboard' }],
        categories: [category],
        history: [],
      },
    });
    const name = screen.getByRole('combobox', { name: 'Product Name *' });
    await user.type(name, 'WI');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.type(name, 'R');
    expect(screen.getAllByRole('option', { name: /PRD-/ })).toHaveLength(2);
    await user.type(name, 'EL');
    expect(screen.getAllByRole('option', { name: /PRD-/ })).toHaveLength(1);
    await user.keyboard('{Backspace}');
    expect(screen.getAllByRole('option', { name: /PRD-/ })).toHaveLength(2);
    await user.clear(name);
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.type(name, 'unmatched');
    expect(screen.getByRole('status').textContent).toContain('No matching products');
    expect(screen.getByRole('button', { name: 'Create Product' })).toBeDefined();
  });

  it('fills all fields and updates the selected product without creating a duplicate', async () => {
    const user = userEvent.setup();
    const otherCategory: Category = {
      id: 'cat-accessories',
      name: 'Accessories',
      isDefault: false,
    };
    const existingProduct = { ...product, categoryId: otherCategory.id };
    const { context, onOpenChange } = renderForm({
      state: { products: [existingProduct], categories: [category, otherCategory], history: [] },
    });
    await user.type(screen.getByLabelText('Product Name *'), 'mou');
    await user.click(screen.getByRole('option', { name: /Wireless Mouse/ }));
    expect(screen.queryByRole('listbox')).toBeNull();
    for (const [label, value] of [
      ['Product Name *', 'Wireless Mouse'],
      ['Product ID (SKU) *', product.productId],
      ['Category *', otherCategory.id],
      ['Price (LKR) *', '3500'],
      ['Current Stock', '8'],
      ['Low Stock Alert Threshold', '2'],
    ]) {
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe(value);
    }
    expect((screen.getByLabelText('Product ID (SKU) *') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Current Stock') as HTMLInputElement).disabled).toBe(false);
    const update = screen.getByRole('button', { name: 'Update Product' }) as HTMLButtonElement;
    expect(update.disabled).toBe(true);
    fireEvent.submit(update.closest('form')!);
    await waitFor(() => expect(update.disabled).toBe(true));
    expect(context.editProduct).not.toHaveBeenCalled();

    const price = screen.getByLabelText('Price (LKR) *');
    await user.clear(price);
    await user.type(price, '4000');
    expect(update.disabled).toBe(false);
    await user.clear(price);
    await user.type(price, '3500.00');
    expect(update.disabled).toBe(true);
    await user.type(screen.getByLabelText('Product Name *'), ' ');
    expect(update.disabled).toBe(true);
    await user.clear(price);
    await user.type(price, '4000');
    await user.click(update);
    await waitFor(() => {
      expect(context.editProduct).toHaveBeenCalledWith(product.productId, {
        name: product.name,
        categoryId: otherCategory.id,
        price: 4000,
        lowStockThreshold: 2,
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(context.addProduct).not.toHaveBeenCalled();
  });

  it('previews stock changes and disables update again when the stock is restored', async () => {
    const user = userEvent.setup();
    const { context, onOpenChange } = renderForm({
      state: { products: [product], categories: [category], history: [] },
    });
    await user.type(screen.getByLabelText('Product Name *'), 'mou');
    await user.click(screen.getByRole('option', { name: /Wireless Mouse/ }));
    const stock = screen.getByLabelText('Current Stock');
    const update = screen.getByRole('button', { name: 'Update Product' }) as HTMLButtonElement;
    expect(update.disabled).toBe(true);
    fireEvent.change(stock, { target: { value: '12' } });
    expect(screen.getByRole('status').textContent).toContain('8 → 12 units (+4)');
    expect(update.disabled).toBe(false);
    fireEvent.change(stock, { target: { value: '3' } });
    expect(screen.getByRole('status').textContent).toContain('8 → 3 units (-5)');
    fireEvent.change(stock, { target: { value: '8' } });
    expect(screen.queryByRole('status')).toBeNull();
    expect(update.disabled).toBe(true);

    fireEvent.change(stock, { target: { value: '0' } });
    await user.click(update);
    await waitFor(() => {
      expect(context.editProduct).toHaveBeenCalledWith(product.productId, {
        name: product.name,
        categoryId: category.id,
        price: product.price,
        lowStockThreshold: product.lowStockThreshold,
        stock: 0,
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(context.addProduct).not.toHaveBeenCalled();
  });

  it.each([
    ['', 'Stock is required'],
    ['-1', 'Stock cannot be negative'],
    ['1.5', 'Stock must be a whole number'],
    ['1000001', 'Stock cannot exceed 1,000,000'],
  ])('rejects invalid existing-product stock "%s"', async (stock, message) => {
    const user = userEvent.setup();
    const { context, onOpenChange } = renderForm({
      state: { products: [product], categories: [category], history: [] },
    });
    await user.type(screen.getByLabelText('Product Name *'), 'mou');
    await user.click(screen.getByRole('option', { name: /Wireless Mouse/ }));
    fireEvent.change(screen.getByLabelText('Current Stock'), { target: { value: stock } });
    await user.click(screen.getByRole('button', { name: 'Update Product' }));
    expect(await screen.findByText(message)).toBeDefined();
    expect(context.editProduct).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('supports keyboard selection and dismisses suggestions without closing the dialog', async () => {
    const user = userEvent.setup();
    const { context, onOpenChange } = renderForm({
      state: { products: [product], categories: [category], history: [] },
    });
    const name = screen.getByLabelText('Product Name *');
    await user.type(name, 'wir');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard('{ArrowDown}');
    expect(name.getAttribute('aria-activedescendant')).toBe('product-match-0');
    await user.keyboard('{Enter}');
    expect((name as HTMLInputElement).value).toBe(product.name);
    expect(
      (screen.getByRole('button', { name: 'Update Product' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(context.addProduct).not.toHaveBeenCalled();
    expect(context.editProduct).not.toHaveBeenCalled();
  });

  it('can return to creation and clears the selection when reopened', async () => {
    const user = userEvent.setup();
    const { setOpen } = renderForm({
      state: { products: [product], categories: [category], history: [] },
    });
    await user.type(screen.getByLabelText('Product Name *'), 'wir');
    await user.click(screen.getByRole('option', { name: /Wireless Mouse/ }));
    await user.click(screen.getByRole('button', { name: 'Create a new product instead' }));
    expect((screen.getByLabelText('Product Name *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Price (LKR) *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Product ID (SKU) *') as HTMLInputElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Create Product' })).toBeDefined();

    await user.type(screen.getByLabelText('Product Name *'), 'wir');
    await user.click(screen.getByRole('option', { name: /Wireless Mouse/ }));
    setOpen(false);
    setOpen(true);
    expect((screen.getByLabelText('Product Name *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Initial Stock *') as HTMLInputElement).value).toBe('0');
    expect(screen.getByRole('button', { name: 'Create Product' })).toBeDefined();
  });

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

  it('clears create form values when the dialog opens again', async () => {
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
    };
    const onOpenChange = vi.fn();
    const renderDialog = (open: boolean) => (
      <InventoryContext.Provider value={context}>
        <ProductFormDialog open={open} onOpenChange={onOpenChange} categories={[category]} />
      </InventoryContext.Provider>
    );

    const { rerender } = render(renderDialog(true));

    fireEvent.change(screen.getByLabelText('Product Name *'), {
      target: { value: 'Previous product' },
    });
    fireEvent.change(screen.getByLabelText('Product ID (SKU) *'), {
      target: { value: 'PREVIOUS001' },
    });
    fireEvent.change(screen.getByLabelText('Price (LKR) *'), { target: { value: '2500' } });

    rerender(renderDialog(false));
    rerender(renderDialog(true));

    await waitFor(() => {
      expect((screen.getByLabelText('Product Name *') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Product ID (SKU) *') as HTMLInputElement).value).not.toBe(
        'PREVIOUS001',
      );
      expect((screen.getByLabelText('Price (LKR) *') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Initial Stock *') as HTMLInputElement).value).toBe('0');
      expect((screen.getByLabelText('Low Stock Alert Threshold') as HTMLInputElement).value).toBe(
        '5',
      );
    });
  });
});
