'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Construction } from 'lucide-react';
import { Suspense } from 'react';

function ConstruccionContent() {
    const searchParams = useSearchParams();
    const modulo = searchParams.get('modulo') || 'Módulo';

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6 animate-bounce">
                <Construction className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
                {modulo} en Construcción
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
                Estamos trabajando arduamente para traerte las mejores funcionalidades.
                Esta sección estará disponible muy pronto.
            </p>
            <Link
                href="/"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
            >
                Volver al Inicio
            </Link>
        </div>
    );
}

export default function ConstruccionPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
            <ConstruccionContent />
        </Suspense>
    );
}
