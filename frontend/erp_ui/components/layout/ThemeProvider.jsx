// components/layout/ThemeProvider.jsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class" // <-- Usa la clase para Tailwind
      defaultTheme="system" // <-- Tema por defecto
      enableSystem // <-- Habilita la preferencia del sistema
      storageKey="erp-theme" // <-- Clave para localStorage
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
