'use client';

import { useConfig } from '@/contexts/ConfigContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * @param {Object} props
 * @param {string} props.feature
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback]
 */
export default function FeatureGuard({ feature, children, fallback = null }) {
    const { isFeatureEnabled, isLoading } = useConfig();
    const router = useRouter();

    const isEnabled = isFeatureEnabled(feature);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isEnabled) {
        if (fallback) return <>{fallback}</>;

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Módulo Deshabilitado</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    El módulo <strong>{feature}</strong> no está activo actualmente en la configuración del sistema.
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
