// app/layout.js
'use client';

import "./globals.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// --- Iconos para los Botones ---
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
  </svg>
);


function AppContent({ children }) {
  const { authTokens } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !authTokens && pathname !== '/login') {
      router.push('/login');
    }
  }, [isMounted, authTokens, pathname, router]);

  if (!isMounted) {
    return null;
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!authTokens) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-800 dark:text-gray-300">Cargando...</div>
      </div>
    );
  }

  return (
    // ### CAMBIO: Se elimina 'relative' de aquí para que el botón fijo funcione mejor ###
    <div className="min-h-screen">
      <Sidebar />

      <main className={`transition-all duration-300 ease-in-out ${isOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>

        {/* Botón para pantallas grandes (flecha) */}
        <div className="hidden lg:block">
          <button
            onClick={toggleSidebar}
            // ### CAMBIO: Se posiciona de forma fija y se mueve con el sidebar ###
            className="fixed top-5 left-0 z-50 p-1.5 bg-gray-700 text-white rounded-r-lg shadow-md transition-all duration-300 ease-in-out"
            style={{ transform: isOpen ? 'translateX(16rem)' : 'translateX(0)' }} // 16rem = w-64
            aria-label="Ocultar menú"
          >
            <div className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}>
              <ArrowLeftIcon />
            </div>
          </button>
        </div>

        {/* Encabezado para pantallas pequeñas (hamburguesa) */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-md p-4 lg:hidden">
          <button onClick={toggleSidebar} className="text-gray-800 dark:text-gray-200">
            <MenuIcon />
          </button>
        </header>

        <div>
          {children}
        </div>
      </main>
    </div>
  );
}


export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-200">
        <AuthProvider>
          <SidebarProvider>
            <AppContent>{children}</AppContent>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}