import { EmptyState } from '@/components/shared/empty-state';
import type { ProductFilters } from '@/state/selectors';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { ProductCards } from './product-cards';
import { ProductTable } from './product-table';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  totalProductsCount: number;
  selectedIds?: string[];
  onToggleSelect?: (productId: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onClearFilters?: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  sortBy?: ProductFilters['sortBy'];
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'productId' | 'price' | 'stock') => void;
}

export function ProductList({
  products,
  categories,
  totalProductsCount,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onClearFilters,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAdjustStock,
  sortBy,
  sortOrder,
  onSort,
}: ProductListProps) {
  if (totalProductsCount === 0) {
    return (
      <EmptyState
        title="No products in inventory"
        description="Get started by creating your first product with auto-generated ID or manual entry."
        actionLabel="Add Product"
        onAction={onAddProduct}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No matching products found"
        description="We couldn't find any products matching your current search terms or filter criteria."
        actionLabel="Clear Filters"
        onAction={onClearFilters ?? onAddProduct}
      />
    );
  }

  return (
    <div>
      <div className="hidden md:block">
        <ProductTable
          products={products}
          categories={categories}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
          onAdjustStock={onAdjustStock}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      </div>

      <div className="block md:hidden">
        <ProductCards
          products={products}
          categories={categories}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
          onAdjustStock={onAdjustStock}
        />
      </div>
    </div>
  );
}
