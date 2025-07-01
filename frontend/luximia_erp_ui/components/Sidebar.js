// components/Sidebar.js
'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ChevronIcon = ({ isOpen }) => (
    <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path>
    </svg>
);

export default function Sidebar() {
    const { user, logoutUser, hasPermission } = useAuth();
    const pathname = usePathname();

    // Estados para controlar los menús desplegables
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isHerramientasOpen, setIsHerramientasOpen] = useState(false);
    const [isImportarOpen, setIsImportarOpen] = useState(false);

    // Efecto para mantener los menús abiertos si estamos en una de sus páginas
    useEffect(() => {
        if (pathname.startsWith('/configuraciones')) setIsConfigOpen(true);
        if (pathname.startsWith('/importar')) {
            setIsHerramientasOpen(true);
            setIsImportarOpen(true);
        }
    }, [pathname]);

    // ### CAMBIO: Usamos el prefijo 'cxc' para los permisos ###
    const canViewSettings = hasPermission('cxc.view_user') || hasPermission('cxc.view_group');
    const canImportData = user?.is_superuser || hasPermission('cxc.add_cliente') || hasPermission('cxc.add_upe') || hasPermission('cxc.add_contrato');

    return (
        <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">

            <div className="p-4 flex-shrink-0">
                <h2 className="text-2xl font-bold mb-4 text-white">Luximia ERP</h2>
                {user && <span className="text-sm text-gray-400">Bienvenido, {user.username}</span>}
            </div>

            <nav className="flex-1 px-4 pb-4 overflow-y-auto">
                <ul className="space-y-1">
                    {/* Enlaces Principales */}
                    {hasPermission('cxc.can_view_dashboard') && <li><Link href="/" className="block p-2 rounded-md hover:bg-blue-600"><span>Dashboard</span></Link></li>}
                    {hasPermission('cxc.view_proyecto') && <li><Link href="/proyectos" className="block p-2 rounded-md hover:bg-blue-600"><span>Proyectos</span></Link></li>}
                    {hasPermission('cxc.view_cliente') && <li><Link href="/clientes" className="block p-2 rounded-md hover:bg-blue-600"><span>Clientes</span></Link></li>}
                    {hasPermission('cxc.view_upe') && <li><Link href="/upes" className="block p-2 rounded-md hover:bg-blue-600"><span>UPEs</span></Link></li>}
                    {hasPermission('cxc.view_contrato') && <li><Link href="/contratos" className="block p-2 rounded-md hover:bg-blue-600"><span>Contratos</span></Link></li>}

                    {/* Menú Desplegable de Herramientas */}
                    {canImportData && (
                        <li className="pt-2">
                            <button onClick={() => setIsHerramientasOpen(!isHerramientasOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-blue-600">
                                <span className="text-sm font-semibold uppercase">Herramientas</span>
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
                                                {/* ### CAMBIO: Usamos 'cxc' y añadimos el importador de Pagos ### */}
                                                {user?.is_superuser && <li><Link href="/importar" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Masivo (General)</Link></li>}
                                                {hasPermission('cxc.add_cliente') && <li><Link href="/importar/clientes" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Clientes</Link></li>}
                                                {hasPermission('cxc.add_upe') && <li><Link href="/importar/upes" className="block p-2 rounded-md hover:bg-gray-700 text-sm">UPEs</Link></li>}
                                                {hasPermission('cxc.add_contrato') && <li><Link href="/importar/contratos" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Contratos</Link></li>}
                                                {hasPermission('cxc.add_pago') && <li><Link href="/importar/pagos" className="block p-2 rounded-md hover:bg-gray-700 text-sm">Pagos Históricos</Link></li>}
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
                            <button onClick={() => setIsConfigOpen(!isConfigOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-blue-600">
                                <span className="text-sm font-semibold uppercase">Configuraciones</span>
                                <ChevronIcon isOpen={isConfigOpen} />
                            </button>
                            {isConfigOpen && (
                                <ul className="pl-4 mt-1 space-y-1">
                                    {/* ### CAMBIO: Lo separamos de nuevo en dos enlaces distintos ### */}
                                    {hasPermission('cxc.view_user') && (
                                        <li>
                                            <Link href="/configuraciones/usuarios" className="block p-2 rounded-md hover:bg-gray-700 text-sm">
                                                Usuarios
                                            </Link>
                                        </li>
                                    )}
                                    {hasPermission('cxc.view_group') && (
                                        <li>
                                            <Link href="/configuraciones/roles" className="block p-2 rounded-md hover:bg-gray-700 text-sm">
                                                Roles
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </li>
                    )}
                </ul>
            </nav>

            <div className="p-4 flex-shrink-0 border-t border-gray-700">
                <button onClick={logoutUser} className="w-full flex items-center justify-center p-2 rounded-md text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}