// components/layout/ThemeProvider.jsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class" // <-- Usa la clase para Tailwind
      defaultTheme="system" // <-- Tema por defecto
      enableSystem // <-- Habilita la preferencia del sistema
      storageKey="luximia-erp-theme" // <-- Clave para localStorage
    >
      {children}
    </NextThemesProvider>
  );
}