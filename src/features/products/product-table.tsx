import { ArrowUpDown, Edit3, SlidersHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { ProductStatusBadge } from './product-status-badge';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'productId' | 'price' | 'stock') => void;
}

export function ProductTable({
  products,
  categories,
  onEdit,
  onDelete,
  onAdjustStock,
  onSort,
}: ProductTableProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                {onSort ? (
                  <button
                    onClick={() => onSort('name')}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <span>Product</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
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
                    <ArrowUpDown className="h-3.5 w-3.5" />
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
                    <ArrowUpDown className="h-3.5 w-3.5" />
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
                    <ArrowUpDown className="h-3.5 w-3.5" />
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

              return (
                <tr key={product.productId} className="transition-colors hover:bg-muted/30">
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
