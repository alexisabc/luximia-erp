// context/SidebarContext.js
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
    return useContext(SidebarContext);
};

export const SidebarProvider = ({ children }) => {
    // ### CAMBIO: El estado ahora depende del tamaño de la pantalla ###
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        // Recuperar estado previo del localStorage para mantener consistencia al recargar
        const stored = localStorage.getItem('sidebar_open_state');
        if (stored !== null) {
            setIsOpen(stored === 'true');
        } else if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    }, []);

    const toggleSidebar = () => {
        setIsOpen(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar_open_state', String(newState));
            return newState;
        });
    };

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};