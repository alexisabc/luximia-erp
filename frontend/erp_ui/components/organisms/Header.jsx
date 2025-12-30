/**
 * Header Organism - Cabecera de aplicación
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Organismo complejo que incluye navegación, búsqueda, notificaciones y perfil
 */
'use client';

import React from 'react';
import { Menu, Search, Bell, User, Settings } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Avatar from '@/components/atoms/Avatar';
import SearchBar from '@/components/molecules/SearchBar';

/**
 * @typedef {Object} HeaderProps
 * @property {Function} [onMenuClick] - Callback al hacer click en el menú
 * @property {Function} [onSearchSubmit] - Callback al buscar
 * @property {number} [notificationCount=0] - Número de notificaciones
 * @property {Object} [user] - Datos del usuario
 * @property {boolean} [showSearch=true] - Mostrar barra de búsqueda
 * @property {string} [className=''] - Clases adicionales
 */

const Header = ({
    onMenuClick,
    onSearchSubmit,
    notificationCount = 0,
    user,
    showSearch = true,
    className = '',
}) => {
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);

    return (
        <header className={`
            sticky top-0 z-30
            bg-white/80 dark:bg-gray-900/80
            backdrop-blur-xl
            border-b border-gray-200/50 dark:border-gray-800/50
            shadow-sm
            transition-colors duration-300
            ${className}
        `}>
            <div className="container-responsive">
                <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
                    {/* Left Section - Menu Button (Mobile) */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Menu}
                            onClick={onMenuClick}
                            className="lg:hidden"
                            aria-label="Abrir menú"
                        />

                        {/* Logo/Brand - Hidden on mobile when search is open */}
                        <div className={`
                            ${isSearchOpen ? 'hidden sm:block' : 'block'}
                        `}>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                                ERP System
                            </h1>
                        </div>
                    </div>

                    {/* Center Section - Search (Desktop) */}
                    {showSearch && (
                        <div className="hidden lg:block flex-1 max-w-2xl mx-8">
                            <SearchBar
                                placeholder="Buscar..."
                                onSubmit={onSearchSubmit}
                            />
                        </div>
                    )}

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Search Button (Mobile/Tablet) */}
                        {showSearch && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Search}
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="lg:hidden"
                                aria-label="Buscar"
                            />
                        )}

                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Bell}
                                aria-label="Notificaciones"
                            />
                            {notificationCount > 0 && (
                                <span className="
                                    absolute -top-1 -right-1
                                    w-5 h-5 sm:w-6 sm:h-6
                                    bg-red-600 text-white
                                    rounded-full
                                    flex items-center justify-center
                                    text-xs font-bold
                                    animate-pulse
                                ">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </div>

                        {/* Settings (Desktop only) */}
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Settings}
                            className="hidden lg:inline-flex"
                            aria-label="Configuración"
                        />

                        {/* User Profile */}
                        <button
                            className="
                                flex items-center gap-2
                                p-1 sm:p-2
                                rounded-lg
                                hover:bg-gray-100 dark:hover:bg-gray-800
                                transition-colors duration-200
                            "
                            aria-label="Perfil de usuario"
                        >
                            <Avatar
                                src={user?.avatar}
                                fallback={user?.name?.charAt(0) || 'U'}
                                size="sm"
                            />
                            <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-[120px]">
                                {user?.name || 'Usuario'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar - Expandable */}
                {showSearch && isSearchOpen && (
                    <div className="lg:hidden pb-3 animate-in slide-in-from-top duration-300">
                        <SearchBar
                            placeholder="Buscar..."
                            onSubmit={(value) => {
                                onSearchSubmit?.(value);
                                setIsSearchOpen(false);
                            }}
                            autoFocus
                        />
                    </div>
                )}
            </div>
        </header>
    );
};

Header.displayName = 'Header';

export default Header;
