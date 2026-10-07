import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Clock, Package, RotateCcw, Search } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useInventory } from '@/state/use-inventory';
import type { MovementType } from '@/types/history';

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function MovementTypeBadge({ type }: { type: MovementType }) {
  switch (type) {
    case 'restock':
      return (
        <Badge variant="success" className="gap-1">
          <ArrowUpRight className="h-3 w-3" />
          <span>Restock</span>
        </Badge>
      );
    case 'sale':
      return (
        <Badge variant="warning" className="gap-1">
          <ArrowDownRight className="h-3 w-3" />
          <span>Sale</span>
        </Badge>
      );
    case 'initial':
    default:
      return (
        <Badge variant="outline" className="gap-1 border-muted-foreground/30 text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>Initial</span>
        </Badge>
      );
  }
}

export function HistoryPage() {
  const { state } = useInventory();

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const sortedHistory = [...state.history].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );

  const filteredHistory = sortedHistory.filter((entry) => {
    if (selectedProduct !== 'all' && entry.productId !== selectedProduct) {
      return false;
    }

    if (selectedType !== 'all' && entry.type !== selectedType) {
      return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = entry.productName.toLowerCase().includes(q);
      const matchId = entry.productId.toLowerCase().includes(q);
      const matchNote = entry.note?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchId && !matchNote) return false;
    }

    return true;
  });

  const uniqueProductIds = Array.from(new Set(state.history.map((h) => h.productId)));
  const isFiltered = search !== '' || selectedProduct !== 'all' || selectedType !== 'all';

  const handleClearFilters = () => {
    setSearch('');
    setSelectedProduct('all');
    setSelectedType('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Stock History
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Complete audit trail of all inventory restocks, sales, and initial quantities.
          </p>
        </div>
      </div>

      {state.history.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-12">
            <div className="relative sm:col-span-2 lg:col-span-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history by product name, SKU, or note..."
                className="pl-9"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Filter by product"
              >
                <option value="all">All Products</option>
                {uniqueProductIds.map((pId) => {
                  const item = state.history.find((h) => h.productId === pId);
                  return (
                    <option key={pId} value={pId}>
                      {item?.productName ?? pId} ({pId})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Filter by movement type"
              >
                <option value="all">All Types</option>
                <option value="restock">Restock (+)</option>
                <option value="sale">Sale (-)</option>
                <option value="initial">Initial Stock</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filteredHistory.length}</strong> of{' '}
              {state.history.length} movement records
            </span>

            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear filters</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {state.history.length === 0 ? (
        <EmptyState
          title="No stock movements recorded"
          description="Stock movements will automatically be logged here whenever products are added, restocked, or sold."
        />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          title="No matching history records"
          description="Try adjusting your product or movement type filters."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Date & Time
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Change
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Stock Level
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Note / Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{item.productName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.productId}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <MovementTypeBadge type={item.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <span
                        className={cn(
                          'font-mono text-sm font-semibold',
                          item.change > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.change < 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground',
                        )}
                      >
                        {item.change > 0 ? `+${item.change}` : item.change}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-xs text-muted-foreground">
                      <span>{item.previousStock}</span>
                      <span className="mx-1 text-muted-foreground/60">→</span>
                      <span className="font-semibold text-foreground">{item.newStock}</span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-xs text-muted-foreground">
                      {item.note ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="overflow-hidden shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold text-foreground">{item.productName}</h4>
                      <p className="font-mono text-xs text-muted-foreground">{item.productId}</p>
                    </div>
                    <MovementTypeBadge type={item.type} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
                    <span className="text-muted-foreground">{formatDate(item.timestamp)}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono font-bold',
                          item.change > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.change < 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground',
                        )}
                      >
                        {item.change > 0 ? `+${item.change}` : item.change}
                      </span>
                      <span className="text-muted-foreground">
                        ({item.previousStock} → <strong>{item.newStock}</strong>)
                      </span>
                    </div>
                  </div>

                  {item.note && (
                    <p className="mt-2 text-xs italic text-muted-foreground">“{item.note}”</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
