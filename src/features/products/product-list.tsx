import { EmptyState } from '@/components/shared/empty-state';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { ProductCards } from './product-cards';
import { ProductTable } from './product-table';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
}

export function ProductList({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAdjustStock,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products in inventory"
        description="Get started by creating your first product with auto-generated ID or manual entry."
        actionLabel="Add Product"
        onAction={onAddProduct}
      />
    );
  }

  return (
    <div>
      {/* Desktop View (>= 768px) */}
      <div className="hidden md:block">
        <ProductTable
          products={products}
          categories={categories}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
          onAdjustStock={onAdjustStock}
        />
      </div>

      {/* Mobile View (< 768px) */}
      <div className="block md:hidden">
        <ProductCards
          products={products}
          categories={categories}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
          onAdjustStock={onAdjustStock}
        />
      </div>
    </div>
  );
}
