import type { ErrorCode, Result } from '@/types/result';

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode, message: string): Result<never> {
  return { ok: false, error: { code, message } };
}
