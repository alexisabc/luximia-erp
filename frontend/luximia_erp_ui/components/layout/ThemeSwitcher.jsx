// components/layout/ThemeSwitcher.jsx
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher({ className }) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Evita mostrar un ícono incorrecto durante la renderización en el servidor
    if (!mounted) {
        return (
            <button className={`${className || 'w-full px-4 py-2 text-sm'} flex items-center`}>
                <Monitor className="h-5 w-5" />
                <span className="ml-2">Auto</span>
            </button>
        );
    }

    const cycleTheme = () => {
        if (theme === 'system') {
            setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
        } else if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        }
    };

    const current = theme === 'system' ? resolvedTheme : theme;
    const icon =
        theme === 'system'
            ? <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            : current === 'light'
                ? <Sun className="h-5 w-5 text-yellow-500" />
                : <Moon className="h-5 w-5 text-blue-500" />;

    const label = theme === 'system' ? 'Auto' : current === 'light' ? 'Claro' : 'Oscuro';

    return (
        <button
            onClick={cycleTheme}
            className={`${className || 'w-full px-4 py-2 text-sm'} flex items-center`}
            title="Cambiar tema"
        >
            <span className="transition-transform duration-300" key={current}>
                {icon}
            </span>
            <span className="ml-2">{label}</span>
        </button>
    );
}