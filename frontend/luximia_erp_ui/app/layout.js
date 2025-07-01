// app/layout.js
'use client';

import "./globals.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function AppContent({ children }) {
  const { authTokens } = useAuth();
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
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-luximia-dark">
        <div className="text-gray-800 dark:text-gray-300">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-grow bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="transition-colors duration-300 bg-white text-gray-900 dark:bg-luximia-dark dark:text-gray-200">
        <AuthProvider>
            <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}