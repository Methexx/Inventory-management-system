import { ArrowDown, ArrowUp, ArrowUpDown, Edit3, SlidersHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { selectStockStatus } from '@/state/selectors';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { ProductStatusBadge } from './product-status-badge';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  selectedIds?: string[];
  onToggleSelect?: (productId: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'productId' | 'price' | 'stock') => void;
}

function SortIndicator({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  if (sortBy !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />;
  }
  return sortOrder === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export function ProductTable({
  products,
  categories,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onAdjustStock,
  sortBy,
  sortOrder,
  onSort,
}: ProductTableProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const selectedSet = new Set(selectedIds);
  const isAllSelected = products.length > 0 && products.every((p) => selectedSet.has(p.productId));

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all products on page"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
              <th scope="col" className="px-6 py-3.5">
                {onSort ? (
                  <button
                    onClick={() => onSort('name')}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <span>Product</span>
                    <SortIndicator field="name" sortBy={sortBy} sortOrder={sortOrder} />
                  </button>
                ) : (
                  'Product'
                )}
              </th>
              <th scope="col" className="px-4 py-3.5">
                {onSort ? (
                  <button
                    onClick={() => onSort('productId')}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <span>Product ID</span>
                    <SortIndicator field="productId" sortBy={sortBy} sortOrder={sortOrder} />
                  </button>
                ) : (
                  'Product ID'
                )}
              </th>
              <th scope="col" className="px-4 py-3.5">
                Category
              </th>
              <th scope="col" className="px-4 py-3.5">
                {onSort ? (
                  <button
                    onClick={() => onSort('price')}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <span>Price</span>
                    <SortIndicator field="price" sortBy={sortBy} sortOrder={sortOrder} />
                  </button>
                ) : (
                  'Price'
                )}
              </th>
              <th scope="col" className="px-4 py-3.5">
                {onSort ? (
                  <button
                    onClick={() => onSort('stock')}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <span>Stock</span>
                    <SortIndicator field="stock" sortBy={sortBy} sortOrder={sortOrder} />
                  </button>
                ) : (
                  'Stock'
                )}
              </th>
              <th scope="col" className="px-4 py-3.5">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {products.map((product) => {
              const categoryName = categoryMap.get(product.categoryId) ?? 'Unassigned';
              const status = selectStockStatus(product);

              return (
                <tr
                  key={product.productId}
                  className={cn(
                    'transition-colors',
                    status === 'out'
                      ? 'bg-rose-500/[0.04] hover:bg-rose-500/[0.08]'
                      : status === 'low'
                        ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                        : 'hover:bg-muted/30',
                  )}
                >
                  <td className="w-10 px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      checked={selectedSet.has(product.productId)}
                      onChange={() => onToggleSelect?.(product.productId)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{product.name}</div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {product.productId}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{categoryName}</td>
                  <td className="px-4 py-4 font-medium text-foreground">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-4 text-foreground">
                    <span className="font-semibold">{product.stock}</span>
                    <span className="ml-1 text-xs text-muted-foreground">units</span>
                  </td>
                  <td className="px-4 py-4">
                    <ProductStatusBadge product={product} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onAdjustStock(product)}
                        title="Adjust stock"
                        aria-label={`Adjust stock for ${product.name}`}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(product)}
                        title="Edit product"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(product)}
                        title="Delete product"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
