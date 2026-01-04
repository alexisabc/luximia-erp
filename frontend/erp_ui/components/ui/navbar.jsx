'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Sparkles, ChevronDown, Building2, Menu } from 'lucide-react';
import Image from 'next/image';

/**
 * Navbar Contextual - Barra de navegación superior con selector de empresa,
 * indicador de estado, notificaciones y acciones rápidas.
 */
export default function Navbar({ toggleSidebar, currentCompany, companies, onCompanyChange, isSandbox = false }) {
    const [showCompanyMenu, setShowCompanyMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

    const companyMenuRef = useRef(null);
    const userMenuRef = useRef(null);
    const notificationsRef = useRef(null);

    // Cerrar menús al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (companyMenuRef.current && !companyMenuRef.current.contains(event.target)) {
                setShowCompanyMenu(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCompanySelect = (company) => {
        if (onCompanyChange) {
            onCompanyChange(company);
        }
        setShowCompanyMenu(false);
    };

    // Datos de ejemplo para notificaciones
    const notifications = [
        { id: 1, title: 'Nueva factura pendiente', time: 'Hace 5 min', unread: true },
        { id: 2, title: 'Pago autorizado', time: 'Hace 1 hora', unread: true },
        { id: 3, title: 'Requisición aprobada', time: 'Hace 2 horas', unread: false },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
            {/* Sección Izquierda: Hamburguesa + Selector de Empresa */}
            <div className="flex items-center gap-4">
                {/* Botón Hamburguesa (Móvil) */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>

                {/* Selector de Empresa */}
                <div className="relative" ref={companyMenuRef}>
                    <button
                        onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-gray-900">
                                {currentCompany?.nombre || 'Seleccionar Empresa'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {currentCompany?.rfc || 'RFC'}
                            </p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCompanyMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown de Empresas */}
                    {showCompanyMenu && (
                        <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Cambiar Empresa</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {companies && companies.length > 0 ? (
                                    companies.map((company) => (
                                        <button
                                            key={company.id}
                                            onClick={() => handleCompanySelect(company)}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${currentCompany?.id === company.id ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{company.nombre}</p>
                                            <p className="text-xs text-gray-500">{company.rfc}</p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                        No hay empresas disponibles
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Indicador de Estado */}
                <div className="hidden md:block">
                    {isSandbox ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                            Sandbox Mode
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Online
                        </span>
                    )}
                </div>
            </div>

            {/* Sección Derecha: Acciones Rápidas */}
            <div className="flex items-center gap-2">
                {/* Notificaciones */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Notificaciones"
                    >
                        <Bell className="w-5 h-5 text-gray-600" />
                        {hasUnreadNotifications && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </button>

                    {/* Panel de Notificaciones */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                                <button
                                    onClick={() => setHasUnreadNotifications(false)}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                    Marcar todas como leídas
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${notif.unread ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-3 border-t border-gray-100">
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* IA Briefing */}
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all shadow-sm"
                    aria-label="IA Briefing"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">IA Briefing</span>
                </button>

                {/* Avatar y Menú de Usuario */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            AD
                        </div>
                    </button>

                    {/* Menú de Usuario */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-900">Admin User</p>
                                <p className="text-xs text-gray-500">admin@sistemaerp.com</p>
                            </div>
                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                Mi Perfil
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                Configuración
                            </button>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
