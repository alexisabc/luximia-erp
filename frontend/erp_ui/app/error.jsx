'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-lg w-full">

                {/* Icon wrapper */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900/30 rounded-full blur-xl"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-700">
                        <AlertTriangle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Algo salió mal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Ocurrió un error inesperado al procesar tu solicitud.
                    </p>
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-mono rounded-lg text-left break-all">
                            {error.message}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-center gap-4">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Reintentar
                    </button>
                </div>
            </div>
        </div>
    );
}
