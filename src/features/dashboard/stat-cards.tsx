import { AlertOctagon, AlertTriangle, Boxes, CircleDollarSign } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { InventoryStats } from '@/state/selectors';

interface StatCardsProps {
  stats: InventoryStats;
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-border/80 shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Products</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {stats.totalProducts}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.totalUnits.toLocaleString()} active units in catalog
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Inventory Value</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCurrency(stats.totalInventoryValue)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on current stock × unit price
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Low Stock Alert</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {stats.lowStockCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Items at or below safe threshold</p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {stats.outOfStockCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Items needing immediate reorder</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
