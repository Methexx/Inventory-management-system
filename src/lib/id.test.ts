import { PRODUCT_ID_GENERATION } from '@/constants/id-generation';
import { createId, generateProductId } from './id';

// PRD + 6 digits, e.g. PRD482910
const PRODUCT_ID_REGEX = /^PRD\d{6}$/;

// UUID v4 pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateProductId', () => {
  it('returns a valid PRD + 6-digit product ID on the success path', () => {
    const result = generateProductId([]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatch(PRODUCT_ID_REGEX);
    }
  });

  it('returns an ID that is not already in the existing list', () => {
    // Build a list of many existing IDs so the generator must pick a different one.
    const existing = Array.from({ length: 50 }, (_, i) => `PRD${String(i).padStart(6, '0')}`);
    const result = generateProductId(existing);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(existing.map((id) => id.toUpperCase())).not.toContain(result.data.toUpperCase());
    }
  });

  it('avoids a collision with an existing ID given in lowercase', () => {
    // Comparison must be case-insensitive; "prd000000" must be treated as taken.
    const existingLower = ['prd000000'];
    const result = generateProductId(existingLower);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.toUpperCase()).not.toBe('PRD000000');
    }
  });

  it('returns VALIDATION_ERROR when random and fallback attempts are all exhausted', () => {
    // Mock Math.random so all 20 random attempts land on the same number (500000 → PRD500000).
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Mock Date.now so the fallback starts at offset 100 (100 % 1_000_000 = 100).
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(100);

    // Pre-fill PRD500000 (random target) plus the 100 fallback candidates PRD000100–PRD000199.
    const blockedIds = ['PRD500000'];
    for (let i = 0; i < PRODUCT_ID_GENERATION.fallbackAttempts; i++) {
      blockedIds.push(`PRD${String(100 + i).padStart(6, '0')}`);
    }

    const result = generateProductId(blockedIds);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message.length).toBeGreaterThan(0);
    }

    mathSpy.mockRestore();
    dateSpy.mockRestore();
  });
});

describe('createId', () => {
  it('returns a UUID v4 formatted string', () => {
    const id = createId();
    expect(id).toMatch(UUID_REGEX);
  });

  it('returns a different value on each call', () => {
    const a = createId();
    const b = createId();
    expect(a).not.toBe(b);
  });
});
