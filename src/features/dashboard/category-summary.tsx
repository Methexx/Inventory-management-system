import { Folder } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryCount } from '@/state/selectors';

interface CategorySummaryProps {
  categories: CategoryCount[];
  totalProducts: number;
}

export function CategorySummary({ categories, totalProducts }: CategorySummaryProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">
            Products by Category
          </CardTitle>
          <p className="text-xs text-muted-foreground">Distribution across catalog groups</p>
        </div>
        <Link to="/categories" className="text-xs font-medium text-primary hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border/60">
          {categories.map((cat) => {
            const percentage =
              totalProducts > 0 ? Math.round((cat.count / totalProducts) * 100) : 0;

            return (
              <div key={cat.categoryId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{cat.count}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({percentage}%)</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">
                    {cat.stockUnits} units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
