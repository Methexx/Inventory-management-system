import { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryCount } from '@/state/selectors';

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
  '#14b8a6',
];

interface CategoryChartProps {
  categories: CategoryCount[];
  totalProducts: number;
}

export function CategoryChart({ categories, totalProducts }: CategoryChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');

  const activeCategories = categories.filter((c) => c.count > 0);

  const data = categories.map((cat, index) => ({
    name: cat.name,
    count: cat.count,
    units: cat.stockUnits,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  if (totalProducts === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Add products to see visual category distribution
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">
            Category Analytics
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Visual breakdown of product counts per category
          </p>
        </div>

        <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Bar
          </button>
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              chartType === 'donut'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Donut
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as (typeof data)[0];
                      const percentage =
                        totalProducts > 0 ? Math.round((item.count / totalProducts) * 100) : 0;
                      return (
                        <div className="rounded-lg border bg-popover p-2.5 shadow-md">
                          <p className="font-semibold text-popover-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} {item.count === 1 ? 'product' : 'products'} ({percentage}%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.units.toLocaleString()} total units
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={activeCategories}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {activeCategories.map((entry, index) => (
                    <Cell key={entry.categoryId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as CategoryCount;
                      const percentage =
                        totalProducts > 0 ? Math.round((item.count / totalProducts) * 100) : 0;
                      return (
                        <div className="rounded-lg border bg-popover p-2.5 shadow-md">
                          <p className="font-semibold text-popover-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} {item.count === 1 ? 'product' : 'products'} ({percentage}%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.stockUnits.toLocaleString()} units
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
