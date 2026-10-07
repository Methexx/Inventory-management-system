import { fail, ok } from './result';

describe('ok', () => {
  it('returns a success result with the supplied data', () => {
    const result = ok('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('works with object data', () => {
    const data = { id: '1', name: 'Test' };
    const result = ok(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(data);
    }
  });
});

describe('fail', () => {
  it('returns a failure result with the correct error code', () => {
    const result = fail('NOT_FOUND', 'This product no longer exists.');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('includes the supplied error message', () => {
    const result = fail('VALIDATION_ERROR', 'Price must be greater than 0.');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Price must be greater than 0.');
    }
  });

  it('supports every defined error code', () => {
    const codes = [
      'VALIDATION_ERROR',
      'NOT_FOUND',
      'DUPLICATE_PRODUCT_ID',
      'DUPLICATE_CATEGORY',
      'INSUFFICIENT_STOCK',
      'CATEGORY_IN_USE',
      'CATEGORY_NOT_FOUND',
      'STORAGE_ERROR',
    ] as const;

    for (const code of codes) {
      const result = fail(code, 'msg');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(code);
      }
    }
  });
});
