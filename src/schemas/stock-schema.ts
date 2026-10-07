import * as Yup from 'yup';

import { LIMITS } from '@/constants/limits';

// Context the factory needs to enforce stock bounds and overselling prevention.
interface StockAdjustSchemaContext {
  currentStock: number;
}

/**
 * Builds the Yup schema for the stock adjustment form.
 *
 * `currentStock` — current stock of the product being adjusted.
 * Decrease is blocked if quantity > currentStock ("Only N units in stock").
 * Increase is blocked if currentStock + quantity > LIMITS.stockMax.
 */
export function createStockAdjustSchema({ currentStock }: StockAdjustSchemaContext) {
  return Yup.object({
    direction: Yup.string()
      .oneOf(['increase', 'decrease'], 'Please select a direction')
      .required('Please select a direction'),

    quantity: Yup.number()
      .typeError('Quantity must be a whole number')
      .required('Quantity is required')
      .integer('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(LIMITS.stockMax, `Quantity cannot exceed ${LIMITS.stockMax.toLocaleString()}`)
      .test('stock-boundary', function (value) {
        if (value === undefined || value === null || Number.isNaN(value)) {
          return true;
        }

        const direction = this.parent?.direction;

        if (direction === 'decrease') {
          if (value > currentStock) {
            return this.createError({
              message: `Only ${currentStock} units in stock`,
            });
          }
        } else if (direction === 'increase') {
          if (currentStock + value > LIMITS.stockMax) {
            return this.createError({
              message: `Stock cannot exceed ${LIMITS.stockMax.toLocaleString()}`,
            });
          }
        }

        return true;
      }),

    note: Yup.string()
      .trim()
      .max(LIMITS.noteMax, `Note cannot exceed ${LIMITS.noteMax} characters`),
  });
}
