// app/layout.js
// ### YA NO LLEVA 'use client' ###

import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SidebarProvider } from "../context/SidebarContext";
import { ThemeProvider } from "../components/layout/ThemeProvider";
import AppContent from "./AppContent"; // <-- Importa el nuevo componente

export const metadata = {
  title: 'Luximia ERP',
  description: 'Sistema ERP para Grupo Luximia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('luximia-erp-theme');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <ThemeProvider storageKey="luximia-erp-theme">
          <AuthProvider>
            <SidebarProvider>
              <AppContent>
                {children}
              </AppContent>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}