'use client';

import { useEmpresa } from '@/context/EmpresaContext';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/context/SidebarContext';

export default function EmpresaSelector() {
    const { empresas, empresaActual, loading, cambiarEmpresa } = useEmpresa();
    const { isOpen } = useSidebar();
    const isCollapsed = !isOpen;

    // Skeleton loading
    if (loading) {
        return (
            <div className="px-3 py-2 mb-4 animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
            </div>
        );
    }

    if (!empresas || empresas.length === 0) {
        return null;
    }

    // Renderizado simplificado para modo colapsado
    if (isCollapsed) {
        return (
            <div className="px-2 py-2 mb-4 flex justify-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-10 h-10 p-0 rounded-xl transition-all duration-200 hover:scale-105 shadow-md border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            style={{ backgroundColor: empresaActual?.color_primario || '#3B82F6' }}
                        >
                            {empresaActual?.logo ? (
                                <img src={empresaActual.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <span className="font-black text-xs text-white">
                                    {/* Mostrar parte significativa del código (ej: '01' de 'LUX01') */}
                                    {empresaActual?.codigo?.length > 3 ? empresaActual?.codigo?.substring(3) : empresaActual?.codigo?.substring(0, 3)}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="right" className="w-[240px] ml-2">
                        {empresas.map(emp => (
                            <DropdownMenuItem key={emp.id} onClick={() => cambiarEmpresa(emp.id)}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emp.color_primario }} />
                                    <span className="truncate">{emp.nombre_comercial}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    // Modificacion: Mostrar siempre el selector completo incluso si es 1 empresa, 
    // para mantener consistencia visual o asegurar que se renderice.
    // El bloque anterior width specific styling might be causing issues or specific desire to see the "Selector".
    // Removing the dedicated 1-company block ensures we use the main block below (which handles 1 company find, dropdown just has 1 item).
    // Or better, let's keep the block but ensure it renders properly.
    // Actually, if the user complains "no me aparece", maybe they HAVE 1 company and that block is hidden/broken?
    // The previous block lines 73-88 look fine.
    // But let's check the conditionals.

    // Debug: Force render logic.
    // If companies.length === 1, we return early. 
    // Maybe the user wants the dropdown style?.
    // Let's modify logic to FALL THROUGH to the main return, so single company also uses the "Selector" style 
    // but maybe disable the dropdown if length is 1?

    // Removing the 'if (empresas.length === 1)' block entirely so it uses the standard layout below. 
    // This simplifies the component and ensures visual consistency.

    return (
        <div className="px-3 py-2 mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between h-auto p-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                                style={{ backgroundColor: empresaActual?.color_primario || '#3B82F6' }}
                            >
                                {empresaActual?.logo ? (
                                    <img src={empresaActual.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <span className="font-bold text-xs">{empresaActual?.codigo?.substring(3) || 'EMP'}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                                    {empresaActual?.codigo || 'SELECCIONAR'}
                                </p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
                                    {empresaActual?.nombre_comercial || 'Seleccione Empresa'}
                                </p>
                            </div>
                        </div>
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 transition-colors" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-[260px] p-2" sideOffset={8}>
                    <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1.5">
                        Mis Empresas ({empresas.length})
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {empresas.map((empresa) => (
                            <DropdownMenuItem
                                key={empresa.id}
                                onClick={() => cambiarEmpresa(empresa.id)}
                                className={`
                                    cursor-pointer px-3 py-2.5 rounded-md my-0.5 transition-colors
                                    ${empresaActual?.id === empresa.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                                `}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div
                                        className="w-2 h-8 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: empresa.color_primario }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs font-bold truncate ${empresaActual?.id === empresa.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {empresa.codigo}
                                            </p>
                                            {empresaActual?.id === empresa.id && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {empresa.nombre_comercial}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
