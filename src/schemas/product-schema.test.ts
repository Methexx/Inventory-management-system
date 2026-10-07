import { createProductSchema } from './product-schema';

describe('createProductSchema', () => {
  const defaultContext = {
    existingProductIds: ['PRD-000001', 'PRD-000002'],
    categoryIds: ['cat-1', 'cat-2'],
    mode: 'create' as const,
  };

  const validProduct = {
    name: 'Wireless Mouse',
    productId: 'PRD-000003',
    categoryId: 'cat-1',
    price: 2500.5,
    stock: 50,
    lowStockThreshold: 5,
  };

  it('validates a correct product in create mode', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate(validProduct)).resolves.toBeTruthy();
  });

  // Name validation
  it('rejects product name shorter than 2 characters', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, name: 'A' })).rejects.toThrow(
      'Name must be at least 2 characters',
    );
  });

  it('rejects product name longer than 80 characters', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, name: 'A'.repeat(81) })).rejects.toThrow(
      'Name must be at most 80 characters',
    );
  });

  it('rejects empty or whitespace-only product name', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, name: '   ' })).rejects.toThrow(
      'Product name is required',
    );
  });

  // Product ID validation
  it('rejects duplicate product ID in create mode (case-insensitive)', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, productId: 'prd-000001' })).rejects.toThrow(
      'Product ID already exists',
    );
  });

  it('rejects product ID with invalid characters', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, productId: 'PRD#999' })).rejects.toThrow(
      'Use letters, numbers and dashes only',
    );
  });

  it('rejects product ID shorter than 3 characters', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, productId: 'AB' })).rejects.toThrow(
      'ID must be at least 3 characters',
    );
  });

  it('rejects product ID longer than 20 characters', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, productId: 'A'.repeat(21) })).rejects.toThrow(
      'ID must be at most 20 characters',
    );
  });

  // Category validation
  it('rejects categoryId not in categoryIds list', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, categoryId: 'non-existent' })).rejects.toThrow(
      'Please choose a category',
    );
  });

  // Price validation
  it('rejects zero or negative price', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, price: 0 })).rejects.toThrow(
      'Price must be greater than 0',
    );
    await expect(schema.validate({ ...validProduct, price: -10 })).rejects.toThrow(
      'Price must be greater than 0',
    );
  });

  it('rejects price with more than 2 decimal places', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, price: 99.999 })).rejects.toThrow(
      'Use at most 2 decimal places',
    );
  });

  it('allows prices with up to 2 decimal places and whole numbers', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, price: 99.9 })).resolves.toBeTruthy();
    await expect(schema.validate({ ...validProduct, price: 100 })).resolves.toBeTruthy();
  });

  it('rejects price exceeding maximum allowed limit', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, price: 100_000_000 })).rejects.toThrow(
      'Price must be at most 99,999,999',
    );
  });

  // Stock validation in create mode
  it('rejects negative stock in create mode', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, stock: -1 })).rejects.toThrow(
      'Stock cannot be negative',
    );
  });

  it('rejects non-integer stock in create mode', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, stock: 12.5 })).rejects.toThrow(
      'Stock must be a whole number',
    );
  });

  it('rejects stock exceeding maximum allowed limit', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, stock: 1_000_001 })).rejects.toThrow(
      'Stock cannot exceed 1,000,000',
    );
  });

  // Low stock threshold
  it('rejects negative low stock threshold', async () => {
    const schema = createProductSchema(defaultContext);
    await expect(schema.validate({ ...validProduct, lowStockThreshold: -5 })).rejects.toThrow(
      'Threshold cannot be negative',
    );
  });

  it('applies default lowStockThreshold when omitted', async () => {
    const schema = createProductSchema(defaultContext);
    const withoutThreshold = {
      name: validProduct.name,
      productId: validProduct.productId,
      categoryId: validProduct.categoryId,
      price: validProduct.price,
      stock: validProduct.stock,
    };
    const result = await schema.validate(withoutThreshold);
    expect(result.lowStockThreshold).toBe(5);
  });

  // Edit mode differences
  it('allows existing product ID and skips stock checks in edit mode', async () => {
    const editSchema = createProductSchema({
      ...defaultContext,
      mode: 'edit',
    });

    // In edit mode, productId is already in existingProductIds and stock is not validated
    const editData = {
      name: 'Updated Mouse',
      productId: 'PRD-000001',
      categoryId: 'cat-1',
      price: 3000,
    };

    await expect(editSchema.validate(editData)).resolves.toBeTruthy();
  });
});
