import type { AppError, Result } from '@/types/result';

import { fail, ok } from './result';

// Describes where the returned data came from.
export type StorageSource = 'stored' | 'missing' | 'fallback';

// Returned by readJSON so callers can distinguish a normal first-run
// (missing) from a corruption warning (fallback + error).
export interface ReadResult<T> {
  data: T;
  source: StorageSource;
  error: AppError | null;
}

// Read error shown when localStorage is inaccessible, the stored value is not
// valid JSON, or the validator rejects the parsed value.
const READ_ERROR_MESSAGE = 'Saved data could not be loaded and has been replaced with defaults.';

// Write error shown when the browser rejects a setItem or removeItem call.
const WRITE_ERROR_MESSAGE = 'Could not save your changes. Check browser storage settings.';

/**
 * Safely read a JSON value from localStorage.
 *
 * Missing key   → { data: fallback, source: 'missing', error: null }
 * Access/parse/validation failure → { data: fallback, source: 'fallback', error: STORAGE_ERROR }
 * Valid stored value → { data: parsed, source: 'stored', error: null }
 *
 * Never writes to localStorage. Never throws for expected failures.
 */
export function readJSON<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): ReadResult<T> {
  let raw: string | null;

  try {
    raw = localStorage.getItem(key);
  } catch {
    // localStorage may be disabled (e.g. certain private-mode browsers).
    return {
      data: fallback,
      source: 'fallback',
      error: { code: 'STORAGE_ERROR', message: READ_ERROR_MESSAGE },
    };
  }

  // A null result means the key has never been written — normal first run.
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

  // The validator checks the full record shape, not only the outer type.
  if (!isValid(parsed)) {
    return {
      data: fallback,
      source: 'fallback',
      error: { code: 'STORAGE_ERROR', message: READ_ERROR_MESSAGE },
    };
  }

  return { data: parsed, source: 'stored', error: null };
}

/**
 * Safely write a JSON value to localStorage.
 *
 * Returns ok(undefined) on success.
 * Returns STORAGE_ERROR if the browser rejects the write (quota exceeded,
 * storage disabled, etc.). Never throws expected failures.
 */
export function writeJSON(key: string, value: unknown): Result<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return ok(undefined);
  } catch {
    return fail('STORAGE_ERROR', WRITE_ERROR_MESSAGE);
  }
}

/**
 * Safely remove a single app key from localStorage.
 *
 * Returns ok(undefined) on success.
 * Returns STORAGE_ERROR if the browser rejects the removal.
 * Never throws expected failures.
 */
export function removeKey(key: string): Result<void> {
  try {
    localStorage.removeItem(key);
    return ok(undefined);
  } catch {
    return fail('STORAGE_ERROR', WRITE_ERROR_MESSAGE);
  }
}
