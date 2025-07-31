// app/AppContent.js
'use client';

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import ChatInteligente from "../components/ChatInteligente";
import { useSidebar } from "../context/SidebarContext";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loader from "../components/Loader";

export default function AppContent({ children }) {
    const { authTokens, hasPermission } = useAuth();
    const { isOpen, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!authTokens && pathname !== '/login') {
            router.push('/login');
        }
    }, [authTokens, pathname, router]);

    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!authTokens) {
        return <Loader className="p-8" />;
    }

    return (
        <div className="min-h-screen">
            <Sidebar />
            {/* ### Los estilos de fondo AHORA se aplican aquí ### */}
            <main className={`pt-16 transition-all duration-300 ease-in-out bg-gray-100 dark:bg-gray-900 ${isOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                <Navbar />
                <div>
                    {children}
                </div>
                {hasPermission('cxc.can_use_ai') && <ChatInteligente />}
            </main>
        </div>
    );
}