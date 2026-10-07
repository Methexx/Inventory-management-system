import { describe, expect, it } from 'vitest';

import { LIMITS } from '@/constants/limits';

import { createBulkRestockSchema } from './bulk-restock-schema';

describe('createBulkRestockSchema', () => {
  const schema = createBulkRestockSchema();

  it('accepts a positive whole quantity and an optional note', async () => {
    await expect(schema.validate({ quantity: 3, note: 'Supplier delivery' })).resolves.toEqual({
      quantity: 3,
      note: 'Supplier delivery',
    });
  });

  it('rejects zero, decimal, and oversized quantities', async () => {
    await expect(schema.validate({ quantity: 0 })).rejects.toThrow('Quantity must be at least 1');
    await expect(schema.validate({ quantity: 1.5 })).rejects.toThrow(
      'Quantity must be a whole number',
    );
    await expect(schema.validate({ quantity: LIMITS.stockMax + 1 })).rejects.toThrow(
      `Quantity cannot exceed ${LIMITS.stockMax.toLocaleString()}`,
    );
  });

  it('rejects notes over the shared limit', async () => {
    await expect(
      schema.validate({ quantity: 1, note: 'a'.repeat(LIMITS.noteMax + 1) }),
    ).rejects.toThrow(`Note cannot exceed ${LIMITS.noteMax} characters`);
  });
});
