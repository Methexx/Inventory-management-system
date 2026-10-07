import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { CategoryChart } from '@/features/dashboard/category-chart';
import { CategorySummary } from '@/features/dashboard/category-summary';
import { LowStockList } from '@/features/dashboard/low-stock-list';
import { StatCards } from '@/features/dashboard/stat-cards';
import { StockAdjustDialog } from '@/features/stock/stock-adjust-dialog';
import { selectCategoryCounts, selectStats } from '@/state/selectors';
import { useInventory } from '@/state/use-inventory';
import type { Product } from '@/types/product';

export function DashboardPage() {
  const { state } = useInventory();
  const stats = selectStats(state);
  const categoryCounts = selectCategoryCounts(state);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  const handleAdjustStock = (product: Product) => {
    setProductToAdjust(product);
    setIsAdjustOpen(true);
  };

  const isEmpty = state.products.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Overview of your inventory valuation, stock health, and category distribution.
          </p>
        </div>

        <Link to="/products">
          <Button className="gap-2 self-start sm:self-auto">
            <PackagePlus className="h-4 w-4" />
            <span>Manage Products</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stat Cards (always renders valid numbers, zeros if empty, never NaN) */}
      <StatCards stats={stats} />

      {isEmpty ? (
        <EmptyState
          title="Your inventory is empty"
          description="Get started by adding your first product to see catalog statistics and stock monitoring in real time."
          actionLabel="Go to Products"
          onAction={() => {}}
        />
      ) : (
        <div className="space-y-6">
          <CategoryChart categories={categoryCounts} totalProducts={stats.totalProducts} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategorySummary categories={categoryCounts} totalProducts={stats.totalProducts} />
            <LowStockList products={state.products} onAdjustStock={handleAdjustStock} />
          </div>
        </div>
      )}

      <StockAdjustDialog
        open={isAdjustOpen}
        onOpenChange={(open) => {
          setIsAdjustOpen(open);
          if (!open) setProductToAdjust(null);
        }}
        product={productToAdjust}
      />
    </div>
  );
}
