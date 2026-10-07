import { readJSON, removeKey, writeJSON } from './storage';

// Simple type guards used across tests.
const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((item) => typeof item === 'string');

const TEST_KEY = 'ims:test:storage';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// readJSON
// ---------------------------------------------------------------------------

describe('readJSON — missing key', () => {
  it('returns the fallback value when the key has never been written', () => {
    const result = readJSON(TEST_KEY, 'default', isString);
    expect(result.data).toBe('default');
  });

  it('reports source as "missing"', () => {
    const result = readJSON(TEST_KEY, 'default', isString);
    expect(result.source).toBe('missing');
  });

  it('carries no error for a missing key (normal first run)', () => {
    const result = readJSON(TEST_KEY, 'default', isString);
    expect(result.error).toBeNull();
  });
});

describe('readJSON — corrupted JSON', () => {
  it('returns the fallback when the stored value is not valid JSON', () => {
    localStorage.setItem(TEST_KEY, '{not valid json}');
    const result = readJSON(TEST_KEY, ['fallback'], isStringArray);
    expect(result.data).toEqual(['fallback']);
  });

  it('reports source as "fallback" for corrupted JSON', () => {
    localStorage.setItem(TEST_KEY, '{not valid json}');
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.source).toBe('fallback');
  });

  it('reports a STORAGE_ERROR for corrupted JSON', () => {
    localStorage.setItem(TEST_KEY, '{not valid json}');
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('STORAGE_ERROR');
  });
});

describe('readJSON — invalid record shape (validator rejects)', () => {
  it('returns the fallback when the validator rejects a parsed value', () => {
    // Stores a number, but the validator expects a string array.
    localStorage.setItem(TEST_KEY, JSON.stringify(42));
    const result = readJSON(TEST_KEY, ['fallback'], isStringArray);
    expect(result.data).toEqual(['fallback']);
  });

  it('reports source as "fallback" when the validator rejects', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify({ unexpected: true }));
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.source).toBe('fallback');
  });

  it('reports a STORAGE_ERROR when the validator rejects', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify(null));
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.error?.code).toBe('STORAGE_ERROR');
    expect(result.error?.message.length).toBeGreaterThan(0);
  });
});

describe('readJSON — valid stored value', () => {
  it('returns the parsed value when the key exists and the validator passes', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify(['electronics', 'clothing']));
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.data).toEqual(['electronics', 'clothing']);
  });

  it('reports source as "stored" for a valid value', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify(['a']));
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.source).toBe('stored');
  });

  it('carries no error for a valid stored value', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify(['a']));
    const result = readJSON(TEST_KEY, [] as string[], isStringArray);
    expect(result.error).toBeNull();
  });
});

describe('readJSON — localStorage access failure', () => {
  it('returns the fallback when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Storage disabled');
    });
    const result = readJSON(TEST_KEY, 'safe', isString);
    expect(result.data).toBe('safe');
    expect(result.source).toBe('fallback');
    expect(result.error?.code).toBe('STORAGE_ERROR');
  });

  it('does not throw when localStorage is inaccessible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('SecurityError');
    });
    expect(() => readJSON(TEST_KEY, 'safe', isString)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// writeJSON
// ---------------------------------------------------------------------------

describe('writeJSON', () => {
  it('returns ok(undefined) and persists the value on success', () => {
    const result = writeJSON(TEST_KEY, ['a', 'b']);
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(['a', 'b']));
  });

  it('returns STORAGE_ERROR when localStorage.setItem throws (quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });
    const result = writeJSON(TEST_KEY, ['data']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('STORAGE_ERROR');
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  it('does not throw when the write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage disabled');
    });
    expect(() => writeJSON(TEST_KEY, 'value')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// removeKey
// ---------------------------------------------------------------------------

describe('removeKey', () => {
  it('returns ok(undefined) and removes the key on success', () => {
    localStorage.setItem(TEST_KEY, 'to-be-removed');
    const result = removeKey(TEST_KEY);
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it('returns ok(undefined) even when the key did not exist', () => {
    // removeItem on a nonexistent key is a no-op in localStorage.
    const result = removeKey(TEST_KEY);
    expect(result.ok).toBe(true);
  });

  it('returns STORAGE_ERROR when localStorage.removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('Storage disabled');
    });
    const result = removeKey(TEST_KEY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('STORAGE_ERROR');
    }
  });

  it('does not throw when the removal fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('Storage disabled');
    });
    expect(() => removeKey(TEST_KEY)).not.toThrow();
  });
});
