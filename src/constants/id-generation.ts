export const PRODUCT_ID_GENERATION = {
  prefix: 'PRD',
  digits: 6,
  numberRange: 1_000_000,
  randomAttempts: 20,
  fallbackAttempts: 100,
} as const;

export const PRODUCT_ID_PATTERN = /^[A-Z0-9-]+$/;
