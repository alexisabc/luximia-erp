// app/layout.js
// ### YA NO LLEVA 'use client' ###

import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SidebarProvider } from "../context/SidebarContext";
import ChartJSSetup from '../components/ChartJSSetup';
import { ThemeProvider } from "../components/ThemeProvider";
import AppContent from "./AppContent"; // <-- Importa el nuevo componente

export const metadata = {
  title: 'Luximia ERP',
  description: 'Sistema ERP para Grupo Luximia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="text-gray-800 dark:text-gray-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            <SidebarProvider>
              <AppContent>
                <ChartJSSetup />
                {children}
              </AppContent>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}