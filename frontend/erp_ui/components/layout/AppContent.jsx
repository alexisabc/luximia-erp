//components/AppContent.jsx
'use client';

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import ChatInteligente from "@/components/features/ChatInteligente";
import { useSidebar } from "@/context/SidebarContext";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Overlay from '@/components/loaders/Overlay';
import SessionTimeout from '@/components/common/SessionTimeout';
import { EmpresaProvider } from '@/context/EmpresaContext';

export default function AppContent({ children }) {
    // 1. Obtén 'loading' desde el contexto
    const { authTokens, hasPermission, loading, logoutUser } = useAuth();
    const { isOpen } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // 2. No hagas nada si el contexto aún está cargando la información inicial
        if (loading) return; // <-- nunca retornes "null" desde useEffect

        const publicPaths = ['/login'];
        if (!authTokens && !publicPaths.includes(pathname) && !pathname.startsWith('/enroll')) {
            router.replace('/login'); // replace evita que el usuario "vuelva" a la privada con back
        }
        // 3. Añade 'loading' a las dependencias del useEffect
    }, [authTokens, pathname, router, loading]);

    // 4. Muestra un loader principal si el contexto está en su fase de carga inicial
    if (loading) {
        return <Overlay className="min-h-screen" />;
    }

    // 5. Si ya no está cargando, decide qué mostrar
    const isPublicPage = pathname === '/login' || pathname.startsWith('/enroll');
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Si no es una página pública y no hay tokens, el useEffect ya lo está redirigiendo,
    // pero podemos mostrar un loader como fallback.
    if (!authTokens) {
        return <Overlay className="min-h-screen" />;
    }

    // Si todo está bien, muestra la aplicación principal
    return (
        <EmpresaProvider>
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
                <SessionTimeout /> {/* <-- Componente de manejo de sesión */}
                <Sidebar />

                <div className={`min-h-screen flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'lg:ml-[17rem]' : 'lg:ml-20'}`}>
                    <Navbar />

                    <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
                        <div key={pathname} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                        {hasPermission('contabilidad.can_use_ai') && <ChatInteligente />}
                    </main>
                </div>
            </div>
        </EmpresaProvider>
    );
}
