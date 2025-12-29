'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Monitor, Laptop, Users, HardDrive,
    Smartphone, Filter,
    Search, Printer, CheckCircle2,
    Eye, Sparkles, History, Layers, ClipboardList, Package, XCircle
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
import DataTable from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Card from '@/components/molecules/Card';
import ActionButtons from '@/components/common/ActionButtons';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

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
                        <p className="font-bold text-gray-900 dark:text-white leading-tight mb-1 text-sm tracking-tight truncate">{r.modelo_nombre}</p>
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
                    DISPONIBLE: { variant: 'success', label: 'Disponible' },
                    ASIGNADO: { variant: 'info', label: 'Asignado' },
                    MANTENIMIENTO: { variant: 'warning', label: 'En Soporte' },
                    BAJA: { variant: 'danger', label: 'Fuera de Uso' },
                    GARANTIA: { variant: 'primary', label: 'Garantía' }
                };
                const config = map[r.estado] || { variant: 'default', label: r.estado };
                return (
                    <Badge variant={config.variant} size="sm" className="whitespace-nowrap">
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
                        <p className="font-bold text-gray-900 dark:text-white leading-tight mb-0.5 text-sm tracking-tight uppercase truncate">
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
                <Badge
                    variant={r.firmada ? 'success' : 'warning'}
                    size="sm"
                    className="whitespace-nowrap flex items-center gap-1.5 justify-center"
                >
                    {r.firmada ? (
                        <><CheckCircle2 className="w-3 h-3" /> Firmada</>
                    ) : (
                        <><XCircle className="w-3 h-3" /> Pendiente</>
                    )}
                </Badge>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8 flex flex-col">

            {/* Header y Acciones */}
            <div className="flex-shrink-0 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Título */}
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 sm:gap-3">
                            <Monitor className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                            <span className="truncate">Inventario de Sistemas</span>
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
                            Gestión centralizada de activos tecnológicos y responsivas.
                        </p>
                    </div>

                    {/* Switcher & Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        {/* Tab Switcher */}
                        <div className="flex items-center p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <button
                                onClick={() => setActiveTab('activos')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all touch-target ${activeTab === 'activos'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Layers className="w-4 h-4" />
                                <span className="hidden xs:inline">Inventario</span>
                            </button >
                            <button
                                onClick={() => setActiveTab('responsivas')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all touch-target ${activeTab === 'responsivas'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span className="hidden xs:inline">Responsivas</span>
                            </button >
                        </div >

                        {/* Action Buttons */}
=======
                                Responsivas
                            </button>
                </div>

>>>>>>> ff8deb2ccbc4b587f035702c72a1f581ab58662c
                < ActionButtons
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)
                    }
                    canToggleInactive={hasPermission(activeTab === 'activos' ? 'sistemas.view_activoit' : 'sistemas.view_asignacionequipo')}
                    onCreate={() => router.push(activeTab === 'activos' ? '/sistemas/inventario/nuevo' : '/sistemas/responsivas/nuevo')}
                    canCreate={hasPermission(activeTab === 'activos' ? 'sistemas.add_activoit' : 'sistemas.add_asignacionequipo')}
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={hasPermission(activeTab === 'activos' ? 'sistemas.add_activoit' : 'sistemas.add_asignacionequipo')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission(activeTab === 'activos' ? 'sistemas.view_activoit' : 'sistemas.view_asignacionequipo')}
                />
            </div >
        </div >
            </div >

        {/* Estadísticas */ }
<<<<<<< HEAD
        < div className = "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6" >
=======
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
>>>>>>> ff8deb2ccbc4b587f035702c72a1f581ab58662c
            {(activeTab === 'activos'
                ? [
                    { label: 'Total Activos', value: totalItems, icon: HardDrive, gradient: 'from-blue-500 to-indigo-600' },
                    { label: 'En Resguardo', value: data.filter(a => a.estado === 'DISPONIBLE').length, icon: Package, gradient: 'from-emerald-500 to-teal-600' },
                    { label: 'En Soporte', value: data.filter(a => a.estado === 'MANTENIMIENTO').length, icon: Filter, gradient: 'from-amber-500 to-orange-600' },
                    { label: 'Asignados', value: data.filter(a => a.estado === 'ASIGNADO').length, icon: Users, gradient: 'from-indigo-500 to-purple-600' }
                ]
                : [
                    { label: 'Total Emitidas', value: totalItems, icon: ClipboardList, gradient: 'from-blue-500 to-indigo-600' },
                    { label: 'Por Firmar', value: data.filter(r => !r.firmada).length, icon: History, gradient: 'from-amber-500 to-orange-600' },
                    { label: 'Firmadas', value: data.filter(r => r.firmada).length, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
                    { label: 'Hoy', value: data.filter(r => r.fecha_asignacion === new Date().toISOString().split('T')[0]).length, icon: Sparkles, gradient: 'from-cyan-500 to-blue-600' }
                ]
            ).map((stat, i) => (
<<<<<<< HEAD
                <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white/80" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-white/80 truncate">{stat.label}</div>
=======
                    <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className="w-8 h-8 text-white/80" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-white/80">{stat.label}</div>
>>>>>>> ff8deb2ccbc4b587f035702c72a1f581ab58662c
                    </div>
                ))}
                </div>

            {/* Tabla con Estilo Tarjeta */ }
                < div className = "flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 flex flex-col" >
                <div className="flex-1 overflow-hidden">
<<<<<<< HEAD
                <DataTable
=======
                    <ReusableTable
>>>>>>> ff8deb2ccbc4b587f035702c72a1f581ab58662c
                    key={activeTab}
                    data={data}
                    columns={activeTab === 'activos' ? columnsActivos : columnsResponsivas}
                    loading={loading}
                    onSearch={setSearch}
<<<<<<< HEAD
                    search={true}
                    mobileCardView={true}
=======
                        searchPlaceholder={activeTab === 'activos' ? "Buscar activos..." : "Buscar responsivas..."}
>>>>>>> ff8deb2ccbc4b587f035702c72a1f581ab58662c
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
                </div >
            </div >

                {/* Modales de Gestión */ }
                < ExportModal
                isOpen = { isExportModalOpen }
                onClose = {() => setIsExportModalOpen(false)}
columns = { COLUMNAS_EXPORT_ACTIVOS } // Por ahora solo activos
selectedColumns = { selectedColumns }
onColumnChange = { handleColumnChange }
onDownload = { handleExport }
onSelectAll = { handleSelectAllColumns }
data = { data }
withPreview = { activeTab === 'activos'}
            />

    < ImportModal
isOpen = { isImportModalOpen }
onClose = {() => setIsImportModalOpen(false)}
onImport = { activeTab === 'activos' ? importarActivosIT : importarAsignaciones}
onSuccess = {() => fetchData()}
templateUrl = { activeTab === 'activos' ? "/sistemas/activos/exportar-plantilla/" : "/sistemas/asignaciones/exportar-plantilla/"}
            />
        </div >
    );
}
