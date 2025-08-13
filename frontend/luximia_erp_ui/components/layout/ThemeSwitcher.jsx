// components/layout/ThemeSwitcher.jsx
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher({ className }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Esto evita que el ícono incorrecto se muestre en el servidor
    if (!mounted) {
        return (
            <button className={`${className || 'w-full px-4 py-2 text-sm'} flex items-center`}>
                <Monitor className="h-5 w-5" />
                <span className="ml-2">Auto</span>
            </button>
        );
    }

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const icon = theme === 'light'
        ? <Sun className="h-5 w-5 text-yellow-500" />
        : theme === 'dark'
            ? <Moon className="h-5 w-5 text-blue-500" />
            : <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />;

    const label = theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Auto';

    return (
        <button
            onClick={cycleTheme}
            className={`${className || 'w-full px-4 py-2 text-sm'} flex items-center`}
            title="Cambiar tema"
        >
            <span className="transition-transform duration-300" key={theme}>
                {icon}
            </span>
            <span className="ml-2">{label}</span>
        </button>
    );
}