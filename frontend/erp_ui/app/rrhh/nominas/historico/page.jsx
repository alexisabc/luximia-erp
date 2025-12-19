'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHistoricoNomina, exportarHistoricoNominaExcel, borrarHistoricoNomina } from '@/services/rrhh';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, RefreshCw, FileText, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HistoricoNominaPage() {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        empresa: '',
        periodo: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10, // Optimizado para 10 registros por página
        total: 0
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                empresa__icontains: filters.empresa,
                periodo__icontains: filters.periodo,
                nombre__icontains: filters.search
            };
            const response = await getHistoricoNomina(pagination.page, pagination.pageSize, params);
            if (response.data.results) {
                setData(response.data.results);
                setPagination(prev => ({ ...prev, total: response.data.count }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos históricos");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = {
                empresa__icontains: filters.empresa,
                periodo__icontains: filters.periodo,
                nombre__icontains: filters.search
            };
            const response = await exportarHistoricoNominaExcel(params);

            // Crear link de descarga
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Historico_Nomina_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Archivo descargado correctamente");
        } catch (error) {
            console.error("Error exportando:", error);
            toast.error("Error al exportar a Excel");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar los registros del histórico que coinciden con los filtros actuales? Esta acción NO se puede deshacer.")) {
            return;
        }

        try {
            setLoading(true);
            const params = {
                empresa__icontains: filters.empresa,
                periodo__icontains: filters.periodo,
                nombre__icontains: filters.search
            };
            await borrarHistoricoNomina(params);
            toast.success("Registros eliminados correctamente");
            loadData();
        } catch (error) {
            console.error("Error eliminando:", error);
            toast.error("Error al eliminar registros");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [pagination.page, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const columns = [
        { key: 'esquema', label: 'Esquema' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'periodo', label: 'Periodo' },
        { key: 'empresa', label: 'Empresa' },
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'departamento', label: 'Depto' },
        { key: 'puesto', label: 'Puesto' },
        { key: 'neto_mensual', label: 'Neto Mensual', format: 'currency' },
        { key: 'sueldo_diario', label: 'SDO', format: 'currency' },
        { key: 'dias_trabajados', label: 'Días' },
        { key: 'sueldo', label: 'Sueldo', format: 'currency' },
        { key: 'vacaciones', label: 'Vacaciones', format: 'currency' },
        { key: 'prima_vacacional', label: 'Prima Vac.', format: 'currency' },
        { key: 'aguinaldo', label: 'Aguinaldo', format: 'currency' },
        { key: 'retroactivo', label: 'Retroactivo', format: 'currency' },
        { key: 'subsidio', label: 'Subsidio', format: 'currency' },
        { key: 'total_percepciones', label: 'Total Percepciones', format: 'currency' },
        { key: 'isr', label: 'ISR', format: 'currency' },
        { key: 'imss', label: 'IMSS', format: 'currency' },
        { key: 'prestamo', label: 'Préstamo', format: 'currency' },
        { key: 'infonavit', label: 'Infonavit', format: 'currency' },
        { key: 'total_deducciones', label: 'Total Deducciones', format: 'currency' },
        { key: 'neto', label: 'Neto', format: 'currency' },
        { key: 'isn', label: 'ISN', format: 'currency' },
        { key: 'previo_costo_social', label: 'Previo Costo Soc.', format: 'currency' },
        { key: 'total_carga_social', label: 'Total Carga Soc.', format: 'currency' },
        { key: 'total_nomina', label: 'Total Nómina', format: 'currency' },
        { key: 'nominas_y_costos', label: 'Nóm. + Costos', format: 'currency' },
        { key: 'comision', label: 'Comisión', format: 'currency' },
        { key: 'sub_total', label: 'Sub-Total', format: 'currency' },
        { key: 'iva', label: 'IVA', format: 'currency' },
        { key: 'total_facturacion', label: 'Total Fact.', format: 'currency' },
    ];

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
    };

    return (
        <div className="p-6 space-y-4 h-screen max-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between flex-none">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/rrhh/nominas')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Nóminas
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-emerald-600" />
                        Histórico Centralizado
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDelete} className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40 border">
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar Datos
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                        <Download className="w-4 h-4 mr-2" /> Exportar Excel
                    </Button>
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Recargar
                    </Button>
                </div>
            </div>

            <Card className="flex-grow flex flex-col overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm">
                <CardHeader className="flex-none bg-white dark:bg-gray-950 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-2 rounded-lg">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                placeholder="Buscar por nombre..."
                                className="bg-transparent border-none focus:outline-none text-sm w-48 text-gray-700 dark:text-gray-200"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <input
                            placeholder="Filtrar Empresa"
                            className="bg-gray-100 dark:bg-gray-900 border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-200"
                            value={filters.empresa}
                            onChange={(e) => handleFilterChange('empresa', e.target.value)}
                        />
                        <input
                            placeholder="Filtrar Periodo"
                            className="bg-gray-100 dark:bg-gray-900 border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 w-32 text-gray-700 dark:text-gray-200"
                            value={filters.periodo}
                            onChange={(e) => handleFilterChange('periodo', e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto p-0 bg-white dark:bg-gray-950">
                    <div className="min-w-max">
                        <table className="w-full text-sm text-left relative">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col.key} className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-gray-800 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {data.length > 0 ? (
                                    data.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            {columns.map((col) => (
                                                <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                    {col.format === 'currency' ? formatCurrency(row[col.key]) : row[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                                            {loading ? 'Cargando datos...' : 'No se encontraron registros.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-sm text-gray-500">
                    <span>
                        Total: {pagination.total} registros
                    </span>
                    <div className="flex items-center gap-4">
                        <span>
                            Página {pagination.page}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={data.length < pagination.pageSize}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
