'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-lg w-full">

                {/* Icon wrapper with glow effect */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-700">
                        <ShieldAlert className="w-10 h-10 text-red-500 dark:text-red-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        Acceso Restringido
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Lo sentimos, no tienes los permisos necesarios para acceder a esta sección.
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver al Inicio
                    </Link>
                </div>

                <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
                    Si crees que esto es un error, contacta al administrador del sistema.
                </p>
            </div>
        </div>
    );
}
