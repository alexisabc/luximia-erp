// components/ThemeSwitcher.js
'use client';

import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react'; // <-- LA LÍNEA QUE FALTABA

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <div className="flex items-center justify-center p-1 bg-gray-700 dark:bg-gray-900 rounded-lg">
            <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${theme === 'light' ? 'bg-luximia-gold text-luximia-dark font-semibold' : 'text-gray-300 hover:bg-gray-600'}`}
            >
                Claro
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${theme === 'dark' ? 'bg-luximia-gold text-luximia-dark font-semibold' : 'text-gray-300 hover:bg-gray-600'}`}
            >
                Oscuro
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${theme === 'system' ? 'bg-luximia-gold text-luximia-dark font-semibold' : 'text-gray-300 hover:bg-gray-600'}`}
            >
                Auto
            </button>
        </div>
    );
}