'use client';

import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-lg w-full">

                {/* Icon wrapper */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-700">
                        <FileQuestion className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        La ruta que buscas no existe o ha sido movida.
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                        <Home className="w-5 h-5" />
                        Ir al Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
