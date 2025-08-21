// app/layout.jsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppContent from "@/components/layout/AppContent";

export const metadata = {
  title: 'Luximia ERP',
  description: 'Sistema ERP para Grupo Luximia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <ThemeProvider>
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