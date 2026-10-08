import { Trash2, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkRestock: () => void;
  onBulkDelete: () => void;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkRestock,
  onBulkDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-col gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-foreground">
          {selectedCount === 1 ? 'product selected' : 'products selected'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBulkRestock}
          className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Restock</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={onBulkDelete}
          className="gap-1.5 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClearSelection}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Deselect all"
          aria-label="Deselect all"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
