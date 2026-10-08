import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductStatusBadge } from '@/features/products/product-status-badge';
import type { Product } from '@/types/product';

interface LowStockListProps {
  products: Product[];
  onAdjustStock?: (product: Product) => void;
}

export function LowStockList({ products, onAdjustStock }: LowStockListProps) {
  const attentionItems = products
    .filter((p) => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Stock Attention Items</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Products at or below their designated safe threshold
          </p>
        </div>
        <Link
          to="/products"
          className="self-start text-xs font-medium text-primary hover:underline sm:self-auto"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {attentionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">All stock levels healthy</p>
            <p className="text-xs text-muted-foreground">
              No products are currently low or out of stock.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {attentionItems.slice(0, 5).map((product) => (
              <div
                key={product.productId}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="truncate text-sm font-medium text-foreground">{product.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{product.productId}</span>
                    <span>•</span>
                    <span>
                      <strong className="text-foreground">{product.stock}</strong> /{' '}
                      {product.lowStockThreshold} units safe
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ProductStatusBadge product={product} />
                  {onAdjustStock ? (
                    <button
                      type="button"
                      onClick={() => onAdjustStock(product)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Adjust stock"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
