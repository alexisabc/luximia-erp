'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children, storageKey = 'luximia-erp-theme' }) {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setTheme(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    let applied = theme;
    if (theme === 'system') {
      applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (applied === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
