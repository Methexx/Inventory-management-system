import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS } from '@/constants/storage-keys';

import { useTheme } from './use-theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

describe('useTheme', () => {
  it('uses the saved preference and applies the dark class', async () => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify('dark'));

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('uses the system preference on the first visit and persists a toggle', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe(JSON.stringify('light'));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
