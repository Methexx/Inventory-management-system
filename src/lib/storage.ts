import type { AppError, Result } from '@/types/result';

import { fail, ok } from './result';

export type StorageSource = 'stored' | 'missing' | 'fallback';

export interface ReadResult<T> {
  data: T;
  source: StorageSource;
  error: AppError | null;
}

const READ_ERROR_MESSAGE = 'Saved data could not be loaded and has been replaced with defaults.';

const WRITE_ERROR_MESSAGE = 'Could not save your changes. Check browser storage settings.';

export function readJSON<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): ReadResult<T> {
  let raw: string | null;

  try {
    raw = localStorage.getItem(key);
  } catch {
    return {
      data: fallback,
      source: 'fallback',
      error: { code: 'STORAGE_ERROR', message: READ_ERROR_MESSAGE },
    };
  }

  if (raw === null) {
    return { data: fallback, source: 'missing', error: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      data: fallback,
      source: 'fallback',
      error: { code: 'STORAGE_ERROR', message: READ_ERROR_MESSAGE },
    };
  }

  if (!isValid(parsed)) {
    return {
      data: fallback,
      source: 'fallback',
      error: { code: 'STORAGE_ERROR', message: READ_ERROR_MESSAGE },
    };
  }

  return { data: parsed, source: 'stored', error: null };
}

export function writeJSON(key: string, value: unknown): Result<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return ok(undefined);
  } catch {
    return fail('STORAGE_ERROR', WRITE_ERROR_MESSAGE);
  }
}

export function removeKey(key: string): Result<void> {
  try {
    localStorage.removeItem(key);
    return ok(undefined);
  } catch {
    return fail('STORAGE_ERROR', WRITE_ERROR_MESSAGE);
  }
}
