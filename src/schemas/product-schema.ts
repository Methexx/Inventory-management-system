import * as Yup from 'yup';

import { LIMITS } from '@/constants/limits';

// Context the factory needs to validate uniqueness and category membership.
interface ProductSchemaContext {
  existingProductIds: string[];
  categoryIds: string[];
  mode: 'create' | 'edit';
}

// Checks that a number has at most 2 decimal places.
// Services also enforce this; the schema catches it early with a clear message.
function hasAtMostTwoDecimals(value: number | undefined): boolean {
  if (value === undefined) return true;
  const str = String(value);
  const dot = str.indexOf('.');
  return dot === -1 || str.length - dot - 1 <= 2;
}

/**
 * Builds the Yup schema for the product form.
 *
 * `existingProductIds` — all current IDs (case-insensitive duplicate check).
 * `categoryIds`        — IDs of categories available in the form.
 * `mode`               — 'create' validates productId uniqueness and stock;
 *                        'edit'   skips both (they are read-only in the form).
 */
export function createProductSchema({
  existingProductIds,
  categoryIds,
  mode,
}: ProductSchemaContext) {
  // Normalise once so the per-field test is a simple Set lookup.
  const takenIds = new Set(existingProductIds.map((id) => id.trim().toUpperCase()));

  // productId: validated and checked for uniqueness only when creating.
  // .uppercase() normalises for pattern/uniqueness checks; the submit handler
  // still explicitly uppercases the submitted value (see data-model §9).
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
      : Yup.string(); // read-only in edit; no constraints needed

  // stock: only collected on create. Edit uses Stock Adjust.
  const stockSchema =
    mode === 'create'
      ? Yup.number()
          .typeError('Stock must be a whole number')
          .required('Stock is required')
          .integer('Stock must be a whole number')
          .min(0, 'Stock cannot be negative')
          .max(LIMITS.stockMax, `Stock cannot exceed ${LIMITS.stockMax.toLocaleString()}`)
      : Yup.number(); // read-only in edit

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
