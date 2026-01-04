'use client';

import { useState } from 'react';
import Sidebar from '@/components/ui/sidebar';
import Navbar from '@/components/ui/navbar';

/**
 * Layout Principal del Dashboard
 * Estructura responsive con Sidebar y Navbar
 */
export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Datos de ejemplo para empresas (en producción vendrían del contexto/API)
    const companies = [
        { id: 1, nombre: 'Empresa Principal S.A. de C.V.', rfc: 'EMP850101ABC' },
        { id: 2, nombre: 'Constructora del Norte S.A.', rfc: 'CDN900215XYZ' },
        { id: 3, nombre: 'Desarrollos Inmobiliarios', rfc: 'DIN880330DEF' },
    ];

    const [currentCompany, setCurrentCompany] = useState(companies[0]);
    const [isSandbox, setIsSandbox] = useState(false);

    // Rol del usuario (en producción vendría del contexto de autenticación)
    const userRole = 'ADMIN'; // Opciones: ADMIN, GERENTE, CONTADOR, VENDEDOR, RRHH, etc.

    const handleCompanyChange = (company) => {
        setCurrentCompany(company);
        console.log('Empresa cambiada a:', company.nombre);
        // Aquí iría la lógica para cambiar el contexto de la empresa
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                userRole={userRole}
            />

            {/* Contenedor Principal */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <Navbar
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    currentCompany={currentCompany}
                    companies={companies}
                    onCompanyChange={handleCompanyChange}
                    isSandbox={isSandbox}
                />

                {/* Contenido Principal */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
