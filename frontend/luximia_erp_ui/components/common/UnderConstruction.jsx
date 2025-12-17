'use client';
import { Construction } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnderConstruction({ title }) {
    const searchParams = useSearchParams();
    const modulo = title || searchParams.get('modulo') || 'Módulo';

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-full shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10">
                    <Construction className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                </div>
            </div>

            <h2 className="mt-8 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                {modulo}
            </h2>

            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-md">
                Estamos trabajando duro para traer esta funcionalidad.
                <br />
                Pronto estará disponible para mejorar tu experiencia.
            </p>

            <div className="mt-8">
                <Link href="/" className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
