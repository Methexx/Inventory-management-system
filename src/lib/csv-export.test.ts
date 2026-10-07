import { describe, expect, it } from 'vitest';

import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

import { generateProductsCSV, sanitizeCSVCell } from './csv-export';

describe('csv-export', () => {
  describe('sanitizeCSVCell', () => {
    it('escapes cells with commas, quotes, and newlines', () => {
      expect(sanitizeCSVCell('Hello, World')).toBe('"Hello, World"');
      expect(sanitizeCSVCell('Quote "test"')).toBe('"Quote ""test"""');
      expect(sanitizeCSVCell('Line1\nLine2')).toBe('"Line1\nLine2"');
    });

    it('guards against formula injection (=, +, -, @)', () => {
      expect(sanitizeCSVCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeCSVCell('+12345')).toBe("'+12345");
      expect(sanitizeCSVCell('-danger')).toBe("'-danger");
      expect(sanitizeCSVCell('@command')).toBe("'@command");
      expect(sanitizeCSVCell('  =1+1')).toBe("'  =1+1");
    });

    it('handles numeric and standard text values without mutation', () => {
      expect(sanitizeCSVCell(123)).toBe('123');
      expect(sanitizeCSVCell('Regular Product Name')).toBe('Regular Product Name');
    });
  });

  describe('generateProductsCSV', () => {
    const mockCategories: Category[] = [
      { id: 'cat-1', name: 'Electronics', isDefault: true },
      { id: 'cat-2', name: 'Accessories', isDefault: false },
    ];

    const mockProducts: Product[] = [
      {
        productId: 'PRD-000100',
        name: 'Keyboard, Mechanical "Pro"',
        categoryId: 'cat-1',
        price: 15000,
        stock: 25,
        lowStockThreshold: 5,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        productId: 'PRD-000200',
        name: '=DANGEROUS FORMULA',
        categoryId: 'cat-2',
        price: 500,
        stock: 10,
        lowStockThreshold: 2,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    it('generates header row and maps category names', () => {
      const csv = generateProductsCSV(mockProducts, mockCategories);
      const lines = csv.split('\r\n');

      expect(lines[0]).toBe(
        'Product ID,Name,Category,Price (LKR),Stock,Low Stock Threshold,Created At,Updated At',
      );
      expect(lines[1]).toContain('"Keyboard, Mechanical ""Pro"""');
      expect(lines[1]).toContain('Electronics');
      expect(lines[2]).toContain("'=DANGEROUS FORMULA");
    });

    it('generates headers only when products array is empty', () => {
      const csv = generateProductsCSV([], mockCategories);
      const lines = csv.split('\r\n');

      expect(lines.length).toBe(1);
      expect(lines[0]).toBe(
        'Product ID,Name,Category,Price (LKR),Stock,Low Stock Threshold,Created At,Updated At',
      );
    });
  });
});
