import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

/**
 * Sanitizes a CSV cell to prevent CSV formula injection (DDE attacks)
 * and safely escapes commas, quotes, and newlines.
 *
 * Rules:
 * - If value begins with '=', '+', '-', or '@', prefix with a single quote "'"
 * - If value contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
 */
export function sanitizeCSVCell(value: string | number): string {
  const str = String(value ?? '');

  // Guard against CSV formula injection
  let sanitized = str;
  if (/^[=+\-@]/.test(str.trimStart())) {
    sanitized = `'${str}`;
  }

  // Quote wrapping and escaping
  if (/[",\r\n]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

/**
 * Generates an RFC-compliant CSV string from a product list and category dictionary.
 */
export function generateProductsCSV(products: Product[], categories: Category[]): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    'Product ID',
    'Name',
    'Category',
    'Price (LKR)',
    'Stock',
    'Low Stock Threshold',
    'Created At',
    'Updated At',
  ];

  const rows = products.map((product) => [
    sanitizeCSVCell(product.productId),
    sanitizeCSVCell(product.name),
    sanitizeCSVCell(categoryMap.get(product.categoryId) ?? 'Unassigned'),
    sanitizeCSVCell(product.price),
    sanitizeCSVCell(product.stock),
    sanitizeCSVCell(product.lowStockThreshold),
    sanitizeCSVCell(product.createdAt),
    sanitizeCSVCell(product.updatedAt),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

/**
 * Triggers a browser download for the provided CSV string.
 */
export function downloadCSV(csvContent: string, filename?: string): void {
  const today = new Date().toISOString().split('T')[0];
  const name = filename ?? `inventory-${today}.csv`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
