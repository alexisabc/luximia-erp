/**
 * ActionButtonGroup Molecule - Grupo de botones de acción
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para acciones comunes (crear, importar, exportar, toggle)
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, Upload, Download } from 'lucide-react';
import Button from '@/components/atoms/Button';

/**
 * @typedef {Object} ActionButtonGroupProps
 * @property {boolean} [showInactive=false] - Mostrar inactivos
 * @property {Function} [onToggleInactive] - Callback toggle inactivos
 * @property {boolean} [canToggleInactive=false] - Permitir toggle
 * @property {Function} [onCreate] - Callback crear
 * @property {boolean} [canCreate=false] - Permitir crear
 * @property {Function} [onImport] - Callback importar
 * @property {string} [importHref] - URL de importación
 * @property {boolean} [canImport=false] - Permitir importar
 * @property {Function} [onExport] - Callback exportar
 * @property {boolean} [canExport=false] - Permitir exportar
 * @property {string} [createLabel='Crear'] - Texto botón crear
 * @property {boolean} [compact=false] - Modo compacto (solo iconos)
 * @property {string} [className=''] - Clases adicionales
 */

export default function ActionButtonGroup({
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
    createLabel = 'Crear',
    compact = false,
    className = '',
}) {
    return (
        <div className={`
            flex flex-wrap items-center gap-2 sm:gap-3
            ${className}
        `}>
            {/* Toggle Inactivos */}
            {canToggleInactive && (
                <Button
                    variant={showInactive ? 'secondary' : 'ghost'}
                    size="md"
                    icon={showInactive ? EyeOff : Eye}
                    onClick={onToggleInactive}
                    className={showInactive ? 'ring-2 ring-gray-200 dark:ring-gray-700' : ''}
                    aria-label={showInactive ? 'Ocultar Inactivos' : 'Ver Inactivos'}
                >
                    {!compact && (
                        <span className="hidden sm:inline">
                            {showInactive ? 'Ocultar' : 'Ver'} Inactivos
                        </span>
                    )}
                </Button>
            )}

            {/* Importar */}
            {canImport && (
                importHref ? (
                    <Link href={importHref} className="inline-block">
                        <Button
                            variant="outline"
                            size="md"
                            icon={Upload}
                            className="
                                bg-gradient-to-r from-violet-600 to-purple-600 
                                text-white border-none
                                hover:from-violet-700 hover:to-purple-700
                                shadow-lg shadow-purple-500/25 dark:shadow-purple-900/30
                            "
                        >
                            {!compact && <span className="hidden sm:inline">Importar</span>}
                        </Button>
                    </Link>
                ) : (
                    <Button
                        variant="outline"
                        size="md"
                        icon={Upload}
                        onClick={onImport}
                        className="
                            bg-gradient-to-r from-violet-600 to-purple-600 
                            text-white border-none
                            hover:from-violet-700 hover:to-purple-700
                            shadow-lg shadow-purple-500/25 dark:shadow-purple-900/30
                        "
                    >
                        {!compact && <span className="hidden sm:inline">Importar</span>}
                    </Button>
                )
            )}

            {/* Exportar */}
            {canExport && (
                <Button
                    variant="outline"
                    size="md"
                    icon={Download}
                    onClick={onExport}
                    className="
                        bg-gradient-to-r from-emerald-500 to-green-600 
                        text-white border-none
                        hover:from-emerald-600 hover:to-green-700
                        shadow-lg shadow-green-500/25 dark:shadow-green-900/30
                    "
                >
                    {!compact && <span className="hidden sm:inline">Exportar</span>}
                </Button>
            )}

            {/* Crear */}
            {canCreate && (
                <Button
                    variant="primary"
                    size="md"
                    icon={Plus}
                    onClick={onCreate}
                    className="shadow-lg"
                >
                    {!compact && <span className="hidden sm:inline">{createLabel}</span>}
                </Button>
            )}
        </div>
    );
}
