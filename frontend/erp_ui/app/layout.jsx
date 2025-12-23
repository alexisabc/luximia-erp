// app/layout.jsx
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppContent from "@/components/layout/AppContent";

// Configuración de la fuente Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'ERP System',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Sistema de Gestión Integral',
};

import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-800 dark:text-gray-200 min-h-screen selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-400 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]`}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <AppContent>
                {children}
              </AppContent>
              <Toaster richColors position="top-right" />
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}