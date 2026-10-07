import * as Yup from 'yup';

import { LIMITS } from '@/constants/limits';

interface ProductSchemaContext {
  existingProductIds: string[];
  categoryIds: string[];
  mode: 'create' | 'edit';
}

function hasAtMostTwoDecimals(value: number | undefined): boolean {
  if (value === undefined) return true;
  const str = String(value);
  const dot = str.indexOf('.');
  return dot === -1 || str.length - dot - 1 <= 2;
}

export function createProductSchema({
  existingProductIds,
  categoryIds,
  mode,
}: ProductSchemaContext) {
  const takenIds = new Set(existingProductIds.map((id) => id.trim().toUpperCase()));

  const productIdSchema =
    mode === 'create'
      ? Yup.string()
          .trim()
          .uppercase()
          .required('Product ID is required')
          .min(LIMITS.productIdMin, `ID must be at least ${LIMITS.productIdMin} characters`)
          .max(LIMITS.productIdMax, `ID must be at most ${LIMITS.productIdMax} characters`)
          .matches(/^[A-Z0-9-]+$/, 'Use letters, numbers and dashes only')
          .test('unique-id', 'Product ID already exists', (value) =>
            value === undefined ? true : !takenIds.has(value),
          )
      : Yup.string();

  const stockSchema =
    mode === 'create'
      ? Yup.number()
          .typeError('Stock must be a whole number')
          .required('Stock is required')
          .integer('Stock must be a whole number')
          .min(0, 'Stock cannot be negative')
          .max(LIMITS.stockMax, `Stock cannot exceed ${LIMITS.stockMax.toLocaleString()}`)
      : Yup.number();

  return Yup.object({
    name: Yup.string()
      .trim()
      .required('Product name is required')
      .min(LIMITS.nameMin, `Name must be at least ${LIMITS.nameMin} characters`)
      .max(LIMITS.nameMax, `Name must be at most ${LIMITS.nameMax} characters`),

    productId: productIdSchema,

    categoryId: Yup.string()
      .required('Please choose a category')
      .oneOf(categoryIds, 'Please choose a category'),

    price: Yup.number()
      .typeError('Price must be a number')
      .required('Price is required')
      .moreThan(0, 'Price must be greater than 0')
      .max(LIMITS.priceMax, `Price must be at most ${LIMITS.priceMax.toLocaleString()}`)
      .test('two-decimals', 'Use at most 2 decimal places', hasAtMostTwoDecimals),

    stock: stockSchema,

    lowStockThreshold: Yup.number()
      .typeError('Threshold must be a whole number')
      .integer('Threshold must be a whole number')
      .min(0, 'Threshold cannot be negative')
      .max(LIMITS.stockMax, `Threshold cannot exceed ${LIMITS.stockMax.toLocaleString()}`)
      .default(LIMITS.defaultLowStockThreshold),
  });
}
