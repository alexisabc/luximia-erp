'use client'

import { useState } from 'react'
import { useEmpresa } from '@/context/EmpresaContext'
import {
    Building2,
    ChevronDown,
    FlaskConical,
    ShieldAlert,
    Check,
    RefreshCw
} from 'lucide-react'

export default function CompanySwitcher() {
    const {
        empresas,
        empresaActual,
        sandboxMode,
        toggleSandboxMode,
        cambiarEmpresa
    } = useEmpresa()

    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative inline-block text-left">
            <div className="flex items-center gap-2">
                {/* Selector de Empresa */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
            ${sandboxMode
                            ? 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
          `}
                >
                    <Building2 size={16} className={sandboxMode ? 'text-orange-600' : 'text-slate-500'} />
                    <span className="max-w-[150px] truncate">
                        {empresaActual?.nombre_comercial || 'Seleccionar Empresa'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Toggle Sandbox */}
                <button
                    onClick={toggleSandboxMode}
                    title={sandboxMode ? "Desactivar Modo Sandbox (Regresar a Producción)" : "Activar Modo Sandbox (Entorno de Pruebas)"}
                    className={`
            flex items-center justify-center p-2 rounded-lg border transition-all
            ${sandboxMode
                            ? 'bg-orange-600 border-orange-700 text-white shadow-lg animate-pulse'
                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}
          `}
                >
                    <FlaskConical size={18} />
                </button>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-bottom bg-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                                Mis Razones Sociales
                            </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                            {empresas.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => {
                                        cambiarEmpresa(emp.id)
                                        setIsOpen(false)
                                    }}
                                    className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                    ${emp.id === empresaActual?.id
                                            ? 'bg-blue-50 text-blue-700 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-100'}
                  `}
                                >
                                    <div className="flex flex-col items-start truncate">
                                        <span>{emp.nombre_comercial}</span>
                                        <span className="text-[10px] text-slate-400">{emp.rfc}</span>
                                    </div>
                                    {emp.id === empresaActual?.id && <Check size={16} />}
                                </button>
                            ))}
                        </div>

                        <div className="p-2 border-t bg-slate-50/50">
                            <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 italic">
                                <RefreshCw size={12} />
                                Sincronizado con central
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Banner Sandbox Mode (Portal) */}
            {sandboxMode && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-orange-600"></div>
            )}
        </div>
    )
}
