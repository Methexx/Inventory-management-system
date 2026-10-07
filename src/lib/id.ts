import { PRODUCT_ID_GENERATION, PRODUCT_ID_PATTERN } from '@/constants/id-generation';
import { LIMITS } from '@/constants/limits';
import type { Result } from '@/types/result';
import { fail, ok } from './result';

function buildProductId(number: number): string {
  return `${PRODUCT_ID_GENERATION.prefix}${String(number).padStart(PRODUCT_ID_GENERATION.digits, '0')}`;
}

function isAvailableProductId(candidate: string, existingIds: Set<string>): boolean {
  return (
    candidate.length >= LIMITS.productIdMin &&
    candidate.length <= LIMITS.productIdMax &&
    PRODUCT_ID_PATTERN.test(candidate) &&
    !existingIds.has(candidate)
  );
}

export function generateProductId(existingIds: string[]): Result<string> {
  const normalizedIds = new Set(existingIds.map((id) => id.trim().toUpperCase()));

  for (let attempt = 0; attempt < PRODUCT_ID_GENERATION.randomAttempts; attempt++) {
    const number = Math.floor(Math.random() * PRODUCT_ID_GENERATION.numberRange);
    const candidate = buildProductId(number);
    if (isAvailableProductId(candidate, normalizedIds)) return ok(candidate);
  }

  const start = Date.now() % PRODUCT_ID_GENERATION.numberRange;
  for (let counter = 0; counter < PRODUCT_ID_GENERATION.fallbackAttempts; counter++) {
    const number = (start + counter) % PRODUCT_ID_GENERATION.numberRange;
    const candidate = buildProductId(number);
    if (isAvailableProductId(candidate, normalizedIds)) return ok(candidate);
  }

  return fail(
    'VALIDATION_ERROR',
    'Could not generate a unique product ID. Please enter one manually.',
  );
}

export function createId(): string {
  return crypto.randomUUID();
}
