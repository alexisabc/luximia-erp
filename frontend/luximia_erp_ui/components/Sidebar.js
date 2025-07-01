// components/Sidebar.js
'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';

const ChevronIcon = ({ isOpen }) => (
    <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path>
    </svg>
);

export default function Sidebar() {
    const { user, logoutUser, hasPermission } = useAuth();
    const pathname = usePathname();

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isHerramientasOpen, setIsHerramientasOpen] = useState(false);
    const [isImportarOpen, setIsImportarOpen] = useState(false);

    useEffect(() => {
        if (pathname.startsWith('/configuraciones')) setIsConfigOpen(true);
        if (pathname.startsWith('/importar')) {
            setIsHerramientasOpen(true);
            setIsImportarOpen(true);
        }
    }, [pathname]);

    const canViewSettings = hasPermission('api.view_user') || hasPermission('api.view_group');
    const canImportData = user?.is_superuser || hasPermission('api.add_cliente') || hasPermission('api.add_upe') || hasPermission('api.add_contrato');

    return (
        // Contenedor principal: Ocupa toda la pantalla y es una columna flexible
        <div className="w-64 h-screen bg-luximia-brand-dark text-white flex flex-col">

            {/* --- SECCIÓN SUPERIOR (FIJA) --- */}
            <div className="p-4 flex-shrink-0">
                <h2 className="text-2xl font-bold mb-4">CRM Luximia</h2>
                {user && <span className="text-sm text-gray-400">Bienvenido, {user.username}</span>}
            </div>

            {/* --- SECCIÓN DE NAVEGACIÓN (CON SCROLL) --- */}
            {/* flex-1 hace que ocupe el espacio sobrante y overflow-y-auto le pone el scroll si es necesario */}
            <nav className="flex-1 px-4 pb-4 overflow-y-auto">
                <ul className="space-y-1">
                    {/* Enlaces Principales */}
                    {hasPermission('api.can_view_dashboard') && <li><Link href="/" className="block p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark"><span>Dashboard</span></Link></li>}
                    {hasPermission('api.view_proyecto') && <li><Link href="/proyectos" className="block p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark"><span>Proyectos</span></Link></li>}
                    {hasPermission('api.view_cliente') && <li><Link href="/clientes" className="block p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark"><span>Clientes</span></Link></li>}
                    {hasPermission('api.view_upe') && <li><Link href="/upes" className="block p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark"><span>UPEs</span></Link></li>}
                    {hasPermission('api.view_contrato') && <li><Link href="/contratos" className="block p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark"><span>Contratos</span></Link></li>}

                    {/* Menú Desplegable de Herramientas */}
                    {canImportData && (
                        <li className="pt-2">
                            <button onClick={() => setIsHerramientasOpen(!isHerramientasOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark">
                                <span className="text-sm font-semibold text-gray-400 uppercase">Herramientas</span>
                                <ChevronIcon isOpen={isHerramientasOpen} />
                            </button>
                            {isHerramientasOpen && (
                                <ul className="pl-4 mt-1 space-y-1">
                                    <li>
                                        <button onClick={() => setIsImportarOpen(!isImportarOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-700">
                                            <span>Importar</span>
                                            <ChevronIcon isOpen={isImportarOpen} />
                                        </button>
                                        {isImportarOpen && (
                                            <ul className="pl-4 mt-1 space-y-1">
                                                {user?.is_superuser && <li><Link href="/importar" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Masivo</Link></li>}
                                                {hasPermission('api.add_cliente') && <li><Link href="/importar/clientes" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Clientes</Link></li>}
                                                {hasPermission('api.add_upe') && <li><Link href="/importar/upes" className="block p-2 rounded-md hover:bg-gray-700 text-sm">UPEs</Link></li>}
                                                {hasPermission('api.add_contrato') && <li><Link href="/importar/contratos" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Contratos</Link></li>}
                                            </ul>
                                        )}
                                    </li>
                                </ul>
                            )}
                        </li>
                    )}

                    {/* Menú Desplegable de Configuraciones */}
                    {canViewSettings && (
                        <li className="pt-2">
                            <button onClick={() => setIsConfigOpen(!isConfigOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-luximia-brand-gold hover:text-luximia-brand-dark">
                                <span className="text-sm font-semibold text-gray-400 uppercase">Configuraciones</span>
                                <ChevronIcon isOpen={isConfigOpen} />
                            </button>
                            {isConfigOpen && (
                                <ul className="pl-4 mt-1 space-y-1">
                                    {hasPermission('api.view_user') && <li><Link href="/configuraciones/usuarios" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Usuarios</Link></li>}
                                    {hasPermission('api.view_group') && <li><Link href="/configuraciones/roles" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Roles</Link></li>}
                                </ul>
                            )}
                        </li>
                    )}
                </ul>
            </nav>

            {/* --- SECCIÓN INFERIOR (FIJA) --- */}
            <div className="p-4 flex-shrink-0 border-t border-gray-700">
                <div className="space-y-2">
                    <ThemeSwitcher />
                    <button onClick={logoutUser} className="w-full flex items-center p-2 rounded-md text-red-400 hover:bg-red-700 hover:text-white">
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    );
}