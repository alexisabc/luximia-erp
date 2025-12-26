'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Monitor, Laptop, Users, HardDrive,
    Smartphone, Tablet, Cpu, Info,
    ShieldCheck, Sparkles, Filter, MoreHorizontal,
    Search, Download, Upload, Plus, FileText,
    ClipboardList, Package, CheckCircle2, XCircle,
    Eye, Printer, ArrowRight, History, Layers
} from 'lucide-react';
import { toast } from 'sonner';

import {
    getActivosIT,
    getInactiveActivosIT,
    exportActivosITExcel,
    importarActivosIT,
    getAsignaciones,
    getInactiveAsignaciones,
    importarAsignaciones,
    getAsignacionPdfUrl
} from '@/services/sistemas';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from '@/components/ui/badge';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';
import { Button } from '@/components/ui/button';

const COLUMNAS_EXPORT_ACTIVOS = [
    { id: 'id', label: 'ID' },
    { id: 'modelo_id', label: 'ID Modelo' },
    { id: 'modelo_nombre', label: 'Modelo' },
    { id: 'numero_serie', label: 'Número de Serie' },
    { id: 'etiqueta_interno', label: 'Asset Tag' },
    { id: 'estado', label: 'Estado' },
    { id: 'ubicacion', label: 'Ubicación' },
    { id: 'fecha_compra', label: 'Fecha Compra' },
    { id: 'proveedor', label: 'Proveedor' },
    { id: 'factura_compra', label: 'Factura' },
    { id: 'costo', label: 'Costo' },
];

export default function InventarioSistemasPage() {
    const router = useRouter();
    const { hasPermission } = useAuth();

    // Estado principal de navegación interna
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' | 'responsivas'

    // Estados de datos comunes
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Estados de modales
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        COLUMNAS_EXPORT_ACTIVOS.forEach(c => (allCols[c.id] = true));
        return allCols;
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'activos') {
                const fetchFn = showInactive ? getInactiveActivosIT : getActivosIT;
                const response = await fetchFn(page, pageSize, { search });
                setData(response.data?.results || []);
                setTotalItems(response.data?.count || 0);
            } else {
                const fetchFn = showInactive ? getInactiveAsignaciones : getAsignaciones;
                const response = await fetchFn(page, pageSize, { search });
                setData(response.data?.results || []);
                setTotalItems(response.data?.count || 0);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error al cargar ${activeTab === 'activos' ? 'Inventario' : 'Responsivas'}`);
            setData([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, showInactive, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reiniciar paginación al cambiar de pestaña
    useEffect(() => {
        setPage(1);
        setSearch('');
        setShowInactive(false);
    }, [activeTab]);

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleSelectAllColumns = (selectAll) => {
        const newCols = {};
        COLUMNAS_EXPORT_ACTIVOS.forEach(c => (newCols[c.id] = selectAll));
        setSelectedColumns(newCols);
    };

    const handleExport = async () => {
        if (activeTab !== 'activos') {
            toast.info("Exportación de responsivas próximamente");
            return;
        }
        const columnsToExport = COLUMNAS_EXPORT_ACTIVOS
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportActivosITExcel(columnsToExport, { search, activo: !showInactive });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventario_ti_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
            toast.success("Catálogo exportado");
        } catch (err) {
            toast.error('Error al exportar.');
        }
    };

    const handlePrintResponsiva = (id) => {
        window.open(getAsignacionPdfUrl(id), '_blank');
    };

    const columnsActivos = [
        {
            header: 'Recurso Tecnológico',
            accessorKey: 'modelo_nombre',
            cell: r => (
                <div className="flex items-center gap-4 py-1">
                    <div className="relative group flex-shrink-0">
                        <div className={`p-3 rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${r.estado === 'BAJA' ? 'bg-red-50 dark:bg-red-950/20 text-red-500' :
                            r.estado === 'MANTENIMIENTO' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' :
                                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                            {r.modelo_nombre?.toLowerCase().includes('lap') || r.modelo_nombre?.toLowerCase().includes('book')
                                ? <Laptop className="w-5 h-5" />
                                : r.modelo_nombre?.toLowerCase().includes('cel') || r.modelo_nombre?.toLowerCase().includes('phone')
                                    ? <Smartphone className="w-5 h-5" />
                                    : <Monitor className="w-5 h-5" />
                            }
                        </div>
                        {r.estado === 'DISPONIBLE' && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
                        )}
                    </div>
                    <div className="text-left min-w-0">
                        <p className="font-exrabold text-gray-900 dark:text-white leading-tight mb-1 text-sm tracking-tight truncate">{r.modelo_nombre}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 px-1.5 rounded truncate">S/N: {r.numero_serie}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Estatus Operativo',
            accessorKey: 'estado',
            cell: r => {
                const map = {
                    DISPONIBLE: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', label: 'Disponible' },
                    ASIGNADO: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'Asignado' },
                    MANTENIMIENTO: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800', label: 'En Soporte' },
                    BAJA: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Fuera de Uso' },
                    GARANTIA: { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', label: 'Garantía' }
                };
                const config = map[r.estado] || { color: 'bg-gray-100 text-gray-700 border-gray-200', label: r.estado };
                return (
                    <Badge variant="outline" className={`${config.color} border font-black text-[9px] py-1 px-3 rounded-xl uppercase tracking-widest shadow-sm whitespace-nowrap`}>
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            header: 'Asignación Actual',
            accessorKey: 'empleado_nombre',
            cell: r => r.empleado_nombre ? (
                <div className="flex items-center justify-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300 truncate">{r.empleado_nombre}</span>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-2 text-gray-400/60 font-black italic text-[10px] tracking-widest uppercase whitespace-nowrap">
                    <Package className="w-3.5 h-3.5" />
                    En Resguardo
                </div>
            )
        },
        {
            header: 'Asset Tag',
            accessorKey: 'etiqueta_interno',
            cell: r => (
                <div className="flex justify-center">
                    <span className="font-mono text-[10px] bg-white dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700/60 text-gray-500 font-bold shadow-inner whitespace-nowrap">
                        {r.etiqueta_interno || '--'}
                    </span>
                </div>
            )
        },
    ];

    const columnsResponsivas = [
        {
            header: 'Documento',
            accessorKey: 'id',
            cell: r => (
                <div className="flex items-center gap-4 py-1">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm flex-shrink-0">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                        <p className="font-exrabold text-gray-900 dark:text-white leading-tight mb-0.5 text-sm tracking-tight uppercase truncate">
                            Folio #{r.id}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                            Emitida: {new Date(r.fecha_asignacion).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Beneficiario',
            accessorKey: 'empleado_nombre',
            cell: r => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{r.empleado_nombre}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest truncate">{r.departamento_nombre || 'General'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Estatus Firma',
            accessorKey: 'firmada',
            cell: r => (
                <Badge variant="outline" className={`border font-black text-[9px] py-1 px-3 rounded-xl uppercase tracking-widest shadow-sm whitespace-nowrap ${r.firmada
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
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col bg-gray-50/20 dark:bg-transparent animate-in fade-in duration-700 overflow-x-hidden">

            {/* Header Dashboard Premium */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 relative">
                <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto">
                    <div className="relative group flex-shrink-0">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                            <Monitor className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic leading-none whitespace-nowrap">
                                Centro <span className="text-blue-600 dark:text-blue-400 pr-1.5">IT</span>
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-[13px] flex items-center gap-1.5 whitespace-nowrap">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> Gestión de activos y responsivas
                        </p>
                    </div>
                </div>

                {/* Switcher & Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Tabs Estilizados */}
                    <div className="flex items-center p-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-lg w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('activos')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'activos'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <Layers className="w-4 h-4" />
                            Inventario
                        </button>
                        <button
                            onClick={() => setActiveTab('responsivas')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'responsivas'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <ClipboardList className="w-4 h-4" />
                            Responsivas
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <ActionButtons
                            showInactive={showInactive}
                            onToggleInactive={() => setShowInactive(!showInactive)}
                            canToggleInactive={hasPermission(activeTab === 'activos' ? 'sistemas.view_activoit' : 'sistemas.view_asignacionequipo')}
                            onCreate={() => router.push(activeTab === 'activos' ? '/sistemas/inventario/nuevo' : '/sistemas/responsivas/nuevo')}
                            canCreate={hasPermission(activeTab === 'activos' ? 'sistemas.add_activoit' : 'sistemas.add_asignacionequipo')}
                            onImport={() => setIsImportModalOpen(true)}
                            canImport={hasPermission(activeTab === 'activos' ? 'sistemas.add_activoit' : 'sistemas.add_asignacionequipo')}
                            onExport={() => setIsExportModalOpen(true)}
                            canExport={hasPermission(activeTab === 'activos' ? 'sistemas.view_activoit' : 'sistemas.view_asignacionequipo')}
                        />
                    </div>
                </div>
            </div>

            {/* Estadísticas Adaptables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {(activeTab === 'activos'
                    ? [
                        { label: 'Total Activos', value: totalItems, icon: HardDrive, color: 'blue' },
                        { label: 'En Resguardo', value: data.filter(a => a.estado === 'DISPONIBLE').length, icon: Package, color: 'emerald' },
                        { label: 'En Soporte', value: data.filter(a => a.estado === 'MANTENIMIENTO').length, icon: Filter, color: 'amber' },
                        { label: 'Asignados', value: data.filter(a => a.estado === 'ASIGNADO').length, icon: Users, color: 'indigo' }
                    ]
                    : [
                        { label: 'Total Emitidas', value: totalItems, icon: ClipboardList, color: 'indigo' },
                        { label: 'Por Firmar', value: data.filter(r => !r.firmada).length, icon: History, color: 'amber' },
                        { label: 'Firmadas', value: data.filter(r => r.firmada).length, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Hoy', value: data.filter(r => r.fecha_asignacion === new Date().toISOString().split('T')[0]).length, icon: Sparkles, color: 'blue' }
                    ]
                ).map((stat, i) => (
                    <div key={i} className="group bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl transition-colors group-hover:bg-blue-500 group-hover:text-white`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla con Scroll Controlado */}
            <div className="flex-1 min-h-0 bg-white/70 dark:bg-gray-900/50 backdrop-blur-3xl rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl p-4 lg:p-6 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar rounded-xl">
                    <ReusableTable
                        key={activeTab}
                        data={data}
                        columns={activeTab === 'activos' ? columnsActivos : columnsResponsivas}
                        loading={loading}
                        onSearch={setSearch}
                        pagination={{
                            currentPage: page,
                            totalCount: totalItems,
                            pageSize: pageSize,
                            onPageChange: setPage
                        }}
                        actions={activeTab === 'activos' ? {
                            onEdit: hasPermission('sistemas.change_activoit') ? (r) => router.push(`/sistemas/inventario/editar/${r.id}`) : null,
                        } : {
                            custom: [
                                {
                                    icon: Printer,
                                    onClick: (r) => handlePrintResponsiva(r.id),
                                    label: 'Imprimir',
                                    tooltip: 'Imprimir Responsiva PDF'
                                },
                                {
                                    icon: Eye,
                                    onClick: (r) => router.push(`/sistemas/responsivas/detalle/${r.id}`),
                                    label: 'Ver',
                                    tooltip: 'Ver Detalle'
                                }
                            ]
                        }}
                    />
                </div>
            </div>

            {/* Modales de Gestión */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={COLUMNAS_EXPORT_ACTIVOS} // Por ahora solo activos
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                onSelectAll={handleSelectAllColumns}
                data={data}
                withPreview={activeTab === 'activos'}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={activeTab === 'activos' ? importarActivosIT : importarAsignaciones}
                onSuccess={() => fetchData()}
                templateUrl={activeTab === 'activos' ? "/sistemas/activos/exportar-plantilla/" : "/sistemas/asignaciones/exportar-plantilla/"}
            />
        </div>
    );
}
