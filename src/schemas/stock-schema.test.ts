import { createStockAdjustSchema } from './stock-schema';

describe('createStockAdjustSchema', () => {
  it('validates a valid increase adjustment', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: 5,
        note: 'Restock shipment',
      }),
    ).resolves.toBeTruthy();
  });

  it('validates a valid decrease adjustment within stock limits', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'decrease',
        quantity: 10,
        note: 'All sold out',
      }),
    ).resolves.toBeTruthy();
  });

  it('rejects an invalid direction', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'invalid-dir',
        quantity: 5,
      }),
    ).rejects.toThrow('Please select a direction');
  });

  it('rejects non-integer quantity', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: 3.5,
      }),
    ).rejects.toThrow('Quantity must be a whole number');
  });

  it('rejects quantity less than 1', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: 0,
      }),
    ).rejects.toThrow('Quantity must be at least 1');
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: -5,
      }),
    ).rejects.toThrow('Quantity must be at least 1');
  });

  it('blocks decreasing more than current stock with specific message', async () => {
    const schema = createStockAdjustSchema({ currentStock: 4 });
    await expect(
      schema.validate({
        direction: 'decrease',
        quantity: 5,
      }),
    ).rejects.toThrow('Only 4 units in stock');
  });

  it('blocks increasing beyond maximum allowable stock limit', async () => {
    const schema = createStockAdjustSchema({ currentStock: 999_995 });
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: 10,
      }),
    ).rejects.toThrow('Stock cannot exceed 1,000,000');
  });

  it('allows optional note up to 120 characters', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: 5,
        note: 'A'.repeat(120),
      }),
    ).resolves.toBeTruthy();
  });

  it('rejects note longer than 120 characters', async () => {
    const schema = createStockAdjustSchema({ currentStock: 10 });
    await expect(
      schema.validate({
        direction: 'increase',
        quantity: 5,
        note: 'A'.repeat(121),
      }),
    ).rejects.toThrow('Note cannot exceed 120 characters');
  });
});
