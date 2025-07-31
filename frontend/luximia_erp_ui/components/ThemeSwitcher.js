// components/ThemeSwitcher.js
'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher() {
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

    return (
        <button
            onClick={cycleTheme}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
            title="Cambiar tema"
        >
            <span className="transition-transform duration-300" key={theme}>
                {icon}
            </span>
        </button>
    );
}
