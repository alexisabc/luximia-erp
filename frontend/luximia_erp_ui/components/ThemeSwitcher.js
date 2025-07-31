// components/ThemeSwitcher.js
'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher({ className }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const cycleTheme = () => {
        if (theme === 'light') setTheme('system');
        else if (theme === 'system') setTheme('dark');
        else setTheme('light');
    };

    const icon = theme === 'light'
        ? <Sun className="h-5 w-5 text-yellow-500" />
        : theme === 'system'
            ? <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            : <Moon className="h-5 w-5 text-blue-500" />;

    const label = theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Auto';

    const baseClasses = 'flex items-center rounded-md transition-colors duration-300';
    const defaultClasses = 'w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';

    return (
        <button
            onClick={cycleTheme}
            className={`${baseClasses} ${className || defaultClasses}`}
            title="Cambiar tema"
        >
            <span className="transition-transform duration-300" key={theme}>
                {icon}
            </span>
            <span className="ml-2">{label}</span>
        </button>
    );
}
