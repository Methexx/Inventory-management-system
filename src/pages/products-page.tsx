import { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { BulkActionBar } from '@/features/products/bulk-action-bar';
import { BulkRestockDialog } from '@/features/products/bulk-restock-dialog';
import { ProductFiltersBar } from '@/features/products/product-filters-bar';
import { ProductFormDialog } from '@/features/products/product-form-dialog';
import { ProductList } from '@/features/products/product-list';
import { StockAdjustDialog } from '@/features/stock/stock-adjust-dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { downloadCSV, generateProductsCSV } from '@/lib/csv-export';
import { type ProductFilters, selectFilteredProducts } from '@/state/selectors';
import { useInventory } from '@/state/use-inventory';
import type { Product } from '@/types/product';

export function ProductsPage() {
  const { state, removeProduct, undoRemoveProduct, removeProducts } = useInventory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkRestockOpen, setIsBulkRestockOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [filters, setFilters] = useState<Omit<ProductFilters, 'search'>>({
    categoryId: 'all',
    stockStatus: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const activeFilters: ProductFilters = {
    search: debouncedSearch,
    ...filters,
  };

  const filteredProducts = selectFilteredProducts(state, activeFilters);

  const handleFilterChange = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    if (key === 'search') {
      setSearchInput(value as string);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      categoryId: 'all',
      stockStatus: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  const handleSort = (field: 'name' | 'productId' | 'price' | 'stock') => {
    setFilters((prev) => {
      if (prev.sortBy === field) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        ...prev,
        sortBy: field,
        sortOrder: 'asc',
      };
    });
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    const target = productToDelete;
    const result = removeProduct(target.productId);
    setProductToDelete(null);

    if (result.ok) {
      toast.success(`Deleted "${target.name}"`, {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => {
            const undoResult = undoRemoveProduct(target);
            if (undoResult.ok) {
              toast.info(`Restored "${target.name}"`);
            } else {
              toast.error(undoResult.error.message);
            }
          },
        },
      });
    } else {
      toast.error(result.error.message);
    }
  };

  const selectedProducts = state.products.filter((p) => selectedIds.includes(p.productId));

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      const visibleIds = filteredProducts.map((p) => p.productId);
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    } else {
      const visibleSet = new Set(filteredProducts.map((p) => p.productId));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    }
  };

  const handleConfirmBulkDelete = () => {
    const targets = [...selectedProducts];
    const result = removeProducts(selectedIds);
    setIsBulkDeleteOpen(false);
    setSelectedIds([]);

    if (result.ok) {
      toast.success(`Deleted ${targets.length} products`, {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => {
            targets.forEach((p) => undoRemoveProduct(p));
            toast.info(`Restored ${targets.length} products`);
          },
        },
      });
    } else {
      toast.error(result.error.message);
    }
  };

  const handleAdjustStock = (product: Product) => {
    setProductToAdjust(product);
    setIsAdjustDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Products
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your inventory catalog, stock levels, and product details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (state.products.length === 0) {
                toast.info('No products available to export');
                return;
              }
              const csv = generateProductsCSV(state.products, state.categories);
              downloadCSV(csv);
              toast.success(`Exported ${state.products.length} products to CSV`);
            }}
            className="gap-2 self-start sm:self-auto"
            title="Export all inventory products as a CSV file"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          <Button onClick={handleAdd} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      <ProductFiltersBar
        filters={activeFilters}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        categories={state.categories}
        totalCount={state.products.length}
        filteredCount={filteredProducts.length}
      />

      <ProductList
        products={filteredProducts}
        categories={state.categories}
        totalProductsCount={state.products.length}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onClearFilters={handleResetFilters}
        onAddProduct={handleAdd}
        onEditProduct={handleEdit}
        onDeleteProduct={handleDelete}
        onAdjustStock={handleAdjustStock}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkRestock={() => setIsBulkRestockOpen(true)}
        onBulkDelete={() => setIsBulkDeleteOpen(true)}
      />

      <BulkRestockDialog
        open={isBulkRestockOpen}
        onOpenChange={setIsBulkRestockOpen}
        selectedProducts={selectedProducts}
        onSuccess={() => setSelectedIds([])}
      />

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedProduct(null);
          }
        }}
        product={selectedProduct}
        categories={state.categories}
      />

      <StockAdjustDialog
        open={isAdjustDialogOpen}
        onOpenChange={(open) => {
          setIsAdjustDialogOpen(open);
          if (!open) {
            setProductToAdjust(null);
          }
        }}
        product={productToAdjust}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setProductToDelete(null);
          }
        }}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}" (${productToDelete?.productId})? You can undo this action immediately.`}
        confirmLabel="Delete Product"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="Delete Selected Products"
        description={`Are you sure you want to delete ${selectedIds.length} selected products? You can undo this action immediately.`}
        confirmLabel="Delete Products"
        variant="destructive"
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
