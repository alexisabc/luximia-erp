'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Users, Printer, Download, Eye,
    Trash2, Calendar, Search, ShieldCheck,
    Sparkles, ClipboardList, Package, CheckCircle2,
    XCircle, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

import {
    getAsignaciones,
    getInactiveAsignaciones,
    getAsignacionPdfUrl
} from '@/services/sistemas';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from '@/components/ui/badge';

export default function HistorialResponsivasPage() {
    const router = useRouter();
    const { hasPermission } = useAuth();

    // Estados de datos
    const [loading, setLoading] = useState(true);
    const [responsivas, setResponsivas] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const fetchResponsivas = useCallback(async () => {
        setLoading(true);
        try {
            const fetchFn = showInactive ? getInactiveAsignaciones : getAsignaciones;
            const { data } = await fetchFn(page, pageSize, { search });
            setResponsivas(data.results);
            setTotalItems(data.count);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el historial de responsivas");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, showInactive]);

    useEffect(() => {
        fetchResponsivas();
    }, [fetchResponsivas]);

    const handlePrint = (id) => {
        window.open(getAsignacionPdfUrl(id), '_blank');
    };

    const columns = [
        {
            header: 'Responsiva',
            accessorKey: 'id',
            cell: r => (
                <div className="flex items-center gap-4 py-1">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-exrabold text-gray-900 dark:text-white leading-tight mb-0.5 text-sm tracking-tight uppercase">
                            Folio #{r.id}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 px-1.5 rounded">
                                Emitida: {new Date(r.fecha_asignacion).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Colaborador',
            accessorKey: 'empleado_nombre',
            cell: r => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{r.empleado_nombre}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{r.departamento_nombre || 'General'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'firmada',
            cell: r => (
                <Badge variant="outline" className={`border font-black text-[9px] py-1 px-3 rounded-xl uppercase tracking-widest shadow-sm ${r.firmada
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    }`}>
                    {r.firmada ? (
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Firmada</span>
                    ) : (
                        <span className="flex items-center gap-1.5"><XCircle className="w-3 h-3" /> Pendiente</span>
                    )}
                </Badge>
            )
        },
        {
            header: 'Acciones Rápidas',
            cell: r => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePrint(r.id)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        title="Imprimir PDF"
                    >
                        <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/sistemas/responsivas/DETALLE_TBD`)} // Futuro detalle
                        className="h-9 w-9 p-0 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        title="Ver Detalles"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 sm:p-8 min-h-full flex flex-col bg-gray-50/20 dark:bg-transparent animate-in fade-in duration-700">

            {/* Header Dashboard Premium */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                <div className="flex items-center gap-6 relative">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3">
                            <ClipboardList className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
                                Historial <span className="text-indigo-600 dark:text-indigo-400">Responsivas</span>
                            </h1>
                            <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Archivo TI</Badge>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Control documental de activos tecnológicos
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={() => router.push('/sistemas/responsivas/nuevo')}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold h-12 rounded-2xl px-6 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Responsiva
                    </Button>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('sistemas.view_asignacionequipo')}
                        // canCreate es false aquí porque ya tenemos el botón de Nueva Responsiva
                        canCreate={false}
                        canExport={hasPermission('sistemas.view_asignacionequipo')}
                        onExport={() => toast.info("Función de exportación de historial próximamente")}
                        canImport={false}
                    />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Emitidas', value: totalItems, icon: ClipboardList, color: 'indigo' },
                    { label: 'Por Firmar', value: responsivas.filter(r => !r.firmada).length, icon: Calendar, color: 'amber' },
                    { label: 'Colaboradores', value: [...new Set(responsivas.map(r => r.empleado_id))].length, icon: Users, color: 'blue' },
                    { label: 'Hoy', value: responsivas.filter(r => r.fecha_asignacion === new Date().toISOString().split('T')[0]).length, icon: Sparkles, color: 'emerald' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-2xl shadow-inner`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla Listado */}
            <div className="flex-grow min-h-0 bg-white/70 dark:bg-gray-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl p-6">
                <ReusableTable
                    data={responsivas}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    pagination={{
                        currentPage: page,
                        totalCount: totalItems,
                        pageSize: pageSize,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    );
}
