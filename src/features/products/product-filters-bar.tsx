import { ArrowUpDown, RotateCcw, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProductFilters } from '@/state/selectors';
import type { Category } from '@/types/category';

interface ProductFiltersBarProps {
  filters: ProductFilters;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onFilterChange: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  onResetFilters: () => void;
  categories: Category[];
  totalCount: number;
  filteredCount: number;
}

export function ProductFiltersBar({
  filters,
  searchInput,
  onSearchChange,
  onFilterChange,
  onResetFilters,
  categories,
  totalCount,
  filteredCount,
}: ProductFiltersBarProps) {
  const isFiltered =
    searchInput.trim().length > 0 ||
    filters.categoryId !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.sortBy !== 'updatedAt' ||
    filters.sortOrder !== 'desc';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or product ID..."
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-3">
          <select
            value={filters.categoryId}
            onChange={(e) => onFilterChange('categoryId', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className="lg:col-span-2">
          <select
            value={filters.stockStatus}
            onChange={(e) =>
              onFilterChange('stockStatus', e.target.value as ProductFilters['stockStatus'])
            }
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by stock status"
          >
            <option value="all">All Stock Levels</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Sort Trigger (mobile/extra control) */}
        <div className="flex gap-2 lg:col-span-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value as ProductFilters['sortBy'])}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Sort products by"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="name">Name</option>
            <option value="productId">Product ID</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
            }
            title={
              filters.sortOrder === 'asc'
                ? 'Ascending (click for descending)'
                : 'Descending (click for ascending)'
            }
            aria-label="Toggle sort order"
            className="h-9 w-9 shrink-0"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Counts & Clear Action */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{filteredCount}</strong> of {totalCount}{' '}
          products
        </span>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
