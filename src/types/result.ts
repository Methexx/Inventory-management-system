export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_PRODUCT_ID'
  | 'DUPLICATE_CATEGORY'
  | 'INSUFFICIENT_STOCK'
  | 'CATEGORY_IN_USE'
  | 'CATEGORY_NOT_FOUND'
  | 'STORAGE_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
