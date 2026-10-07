import { useLayoutEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { readJSON, writeJSON } from '@/lib/storage';

export type Theme = 'light' | 'dark';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => readJSON(STORAGE_KEYS.theme, getSystemTheme(), isTheme).data,
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    writeJSON(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, setTheme, toggleTheme };
}
