import { useEffect, useState } from 'react';

/**
 * Returns a debounced value that only updates after the specified delay has passed
 * without changes.
 *
 * @param value The value to debounce.
 * @param delay Milliseconds to wait before updating (default: 300ms).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
