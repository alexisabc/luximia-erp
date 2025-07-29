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

    // Efecto para ajustar el estado del sidebar en la carga inicial
    useEffect(() => {
        // En pantallas pequeñas, el sidebar empieza cerrado.
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    }, []);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};
