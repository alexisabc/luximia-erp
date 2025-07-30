// components/ThemeSwitcher.js
'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const resolvedTheme = theme === 'system'
        ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md ${theme === 'light' || (theme === 'system' && resolvedTheme === 'light') ? 'bg-white shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-900'}`}
                title="Tema Claro"
            >
                <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md ${theme === 'system' ? 'bg-white dark:bg-gray-900 shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                title="Tema del Sistema"
            >
                <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md ${theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark') ? 'bg-gray-800 shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                title="Tema Oscuro"
            >
                <Moon className="h-5 w-5 text-white" />
            </button>
            
        </div>
    );
}
