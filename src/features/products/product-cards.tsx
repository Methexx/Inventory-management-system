import { Edit3, SlidersHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { ProductStatusBadge } from './product-status-badge';

interface ProductCardsProps {
  products: Product[];
  categories: Category[];
  selectedIds?: string[];
  onToggleSelect?: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
}

export function ProductCards({
  products,
  categories,
  selectedIds = [],
  onToggleSelect,
  onEdit,
  onDelete,
  onAdjustStock,
}: ProductCardsProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const selectedSet = new Set(selectedIds);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {products.map((product) => {
        const categoryName = categoryMap.get(product.categoryId) ?? 'Unassigned';
        const isSelected = selectedSet.has(product.productId);

        return (
          <Card
            key={product.productId}
            className={`overflow-hidden shadow-sm transition-all ${
              isSelected ? 'border-primary/60 bg-primary/[0.02]' : ''
            }`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${product.name}`}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary"
                  checked={isSelected}
                  onChange={() => onToggleSelect?.(product.productId)}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold text-foreground">{product.name}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {product.productId}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="truncate text-xs text-muted-foreground">{categoryName}</span>
                  </div>
                </div>
                <ProductStatusBadge product={product} />
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t pt-3">
                <div>
                  <span className="text-xs text-muted-foreground">Price</span>
                  <div className="text-base font-bold text-foreground">
                    {formatCurrency(product.price)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Stock</span>
                  <div className="text-sm font-semibold text-foreground">{product.stock} units</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => onAdjustStock(product)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Stock</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => onEdit(product)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(product)}
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
