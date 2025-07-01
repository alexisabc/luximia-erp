// context/ThemeContext.js
'use client';

import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('system'); // Empezamos con un valor neutro

    // Este efecto se ejecuta solo una vez en el cliente para cargar el tema guardado
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'system';
        setTheme(savedTheme);
    }, []); // El array vacío [] asegura que solo se ejecute al montar

    // Este efecto se ejecuta CADA VEZ que el estado 'theme' cambia
    useEffect(() => {
        const root = window.document.documentElement;

        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        // Aplicamos o quitamos la clase 'dark' del <html>
        root.classList.toggle('dark', isDark);

        // Guardamos la preferencia actual en localStorage para recordarla
        localStorage.setItem('theme', theme);
    }, [theme]); // Se ejecuta cada vez que 'theme' cambia

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};