'use client';

import React, { useState, useEffect } from 'react';
import { Beaker, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SandboxToggle({ condensed = false, className = '' }) {
    const [isSandbox, setIsSandbox] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sandboxMode') === 'true';
        setIsSandbox(stored);
    }, []);

    const toggleSandbox = () => {
        const newState = !isSandbox;
        setIsSandbox(newState);
        localStorage.setItem('sandboxMode', newState);
        // Reload to ensure all services pick up the new state cleanly
        window.location.reload();
    };

    if (condensed) {
        return (
            <button
                onClick={toggleSandbox}
                title={isSandbox ? "Desactivar Sandbox" : "Activar Sandbox"}
                className={`flex items-center justify-center p-2 rounded-xl transition-all ${isSandbox
                    ? 'bg-amber-100 text-amber-700 animate-pulse'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
                    } ${className}`}
            >
                <Beaker className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className={`mt-auto p-4 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300 ${isSandbox ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
            }`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                    <Beaker className={`w-4 h-4 ${isSandbox ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span>Modo Sandbox</span>
                </div>

                <button
                    onClick={toggleSandbox}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${isSandbox ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                >
                    <span
                        className={`${isSandbox ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight whitespace-normal">
                {isSandbox ? (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <ShieldAlert className="w-3 h-3" />
                        Ambiente de Pruebas Activo
                    </span>
                ) : "Activar para realizar pruebas sin afectar datos reales."}
            </div>
        </div>
    );
}
