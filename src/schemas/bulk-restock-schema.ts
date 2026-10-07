import * as Yup from 'yup';

import { LIMITS } from '@/constants/limits';

export function createBulkRestockSchema() {
  return Yup.object({
    quantity: Yup.number()
      .typeError('Quantity must be a whole number')
      .required('Quantity is required')
      .integer('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(LIMITS.stockMax, `Quantity cannot exceed ${LIMITS.stockMax.toLocaleString()}`),
    note: Yup.string()
      .trim()
      .max(LIMITS.noteMax, `Note cannot exceed ${LIMITS.noteMax} characters`),
  });
}
