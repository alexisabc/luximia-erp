import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, Upload, Download } from 'lucide-react';

export default function ActionButtons({
    showInactive = false,
    onToggleInactive,
    canToggleInactive = false,
    onCreate,
    canCreate = false,
    onImport,
    importHref,
    canImport = false,
    onExport,
    canExport = false,
}) {
    const buttonBaseClass = "p-2.5 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md flex items-center justify-center";

    return (
        <div className="flex items-center gap-3">
            {canToggleInactive && (
                <button
                    onClick={onToggleInactive}
                    className={`p-2.5 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ${showInactive ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700' : ''}`}
                    title={showInactive ? 'Ocultar Inactivos' : 'Ver Inactivos'}
                >
                    {showInactive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            )}

            {canImport && (
                importHref ? (
                    <Link
                        href={importHref}
                        className={`${buttonBaseClass} bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-purple-500/25 dark:shadow-purple-900/30`}
                        title="Importar Excel"
                    >
                        <Upload className="h-5 w-5" />
                    </Link>
                ) : (
                    <button
                        onClick={onImport}
                        className={`${buttonBaseClass} bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-purple-500/25 dark:shadow-purple-900/30`}
                        title="Importar Excel"
                    >
                        <Upload className="h-5 w-5" />
                    </button>
                )
            )}

            {canExport && (
                <button
                    onClick={onExport}
                    className={`${buttonBaseClass} bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-500/25 dark:shadow-green-900/30`}
                    title="Exportar Excel"
                >
                    <Download className="h-5 w-5" />
                </button>
            )}

            {canCreate && (
                <button
                    onClick={onCreate}
                    className={`${buttonBaseClass} bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 dark:shadow-blue-900/30`}
                    title="Crear Nuevo"
                >
                    <Plus className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
