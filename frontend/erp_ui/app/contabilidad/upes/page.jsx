'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Building, Home, DollarSign, TrendingUp,
    AlertCircle, Loader2, Package
} from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import {
    getUPEs, getAllProyectos, createUPE, updateUPE, deleteUPE,
    getInactiveUpes, hardDeleteUpe, exportUpesExcel, importarUPEs
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatters';

import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const UPE_COLUMNAS_DISPLAY = [
    {
        header: 'UPE',
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <Home className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{row.identificador}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Nivel {row.nivel}</div>
                </div>
            </div>
        )
    },
    {
        header: 'Proyecto',
        render: (row) => (
            <Badge variant="outline" className="font-medium">
                {row.proyecto_nombre}
            </Badge>
        )
    },
    {
        header: 'Detalles',
        render: (row) => (
            <div className="text-sm">
                <div className="text-gray-700 dark:text-gray-300">{row.metros_cuadrados} m²</div>
                <div className="text-gray-500 dark:text-gray-400">{row.estacionamientos} estac.</div>
            </div>
        )
    },
    {
        header: 'Estado',
        render: (row) => {
            const statusStyles = {
                'Disponible': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                'Vendida': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                'Pagada': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                'Bloqueada': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            };
            return (
                <Badge className={statusStyles[row.estado] || 'bg-gray-100 text-gray-800'}>
                    {row.estado}
                </Badge>
            );
        }
    },
    {
        header: 'Valor Total',
        render: (row) => (
            <div className="text-right font-semibold text-gray-800 dark:text-gray-200">
                {formatCurrency(row.valor_total, row.moneda)}
            </div>
        )
    }
];

const UPE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'proyecto__nombre', label: 'Proyecto' },
    { id: 'identificador', label: 'Identificador' },
    { id: 'nivel', label: 'Nivel' },
    { id: 'metros_cuadrados', label: 'Metros cuadrados' },
    { id: 'estacionamientos', label: 'Estacionamientos' },
    { id: 'valor_total', label: 'Valor Total' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'estado', label: 'Estado' }
];

export default function UPEsPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [proyectos, setProyectos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        identificador: '', nivel: '', metros_cuadrados: '', estacionamientos: '',
        valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: ''
    });
    const [editingUPE, setEditingUPE] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        UPE_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total UPEs',
            value: pageData.count || 0,
            icon: Building,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Disponibles',
            value: pageData.results?.filter(u => u.estado === 'Disponible').length || 0,
            icon: Package,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Vendidas',
            value: pageData.results?.filter(u => u.estado === 'Vendida' || u.estado === 'Pagada').length || 0,
            icon: TrendingUp,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Valor Total',
            value: pageData.results?.length > 0
                ? `$${(pageData.results.reduce((sum, u) => sum + parseFloat(u.valor_total || 0), 0) / 1000000).toFixed(1)}M`
                : '$0',
            icon: DollarSign,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700',
            isAmount: true
        }
    ];

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const [upesRes, proyectosRes] = await Promise.all([
                showInactive
                    ? getInactiveUpes(page, size, { search })
                    : getUPEs(page, size, { search }),
                getAllProyectos()
            ]);
            setPageData(upesRes.data);
            setProyectos(proyectosRes.data.results || proyectosRes.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando UPEs');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => { fetchData(1, pageSize); }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingUPE(null);
        setFormData({
            identificador: '', nivel: '', metros_cuadrados: '', estacionamientos: '',
            valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: ''
        });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (upe) => {
        setEditingUPE(upe);
        setFormData({ ...upe, proyecto: upe.proyecto });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (upe) => {
        setItemToDelete(upe);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingUPE) {
                await updateUPE(editingUPE.id, formData);
                toast.success('UPE actualizada exitosamente');
            } else {
                await createUPE(formData);
                toast.success('UPE creada exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            const errorData = err.response?.data;
            const errorMessages = errorData ? Object.values(errorData).flat().join(', ') : 'Error al guardar la UPE';
            toast.error(errorMessages);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteUPE(itemToDelete.id);
            toast.success('UPE desactivada exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar. La UPE podría tener un contrato asociado.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteUpe(id);
            toast.success('UPE eliminada permanentemente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar definitivamente');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = UPE_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);

        try {
            const response = await exportUpesExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_upes.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
            toast.success('Archivo exportado exitosamente');
        } catch (err) {
            console.error(err);
            toast.error('No se pudo exportar el archivo');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Gestión de UPEs
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Administra las unidades privativas y su disponibilidad
                        </p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_upe')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_upe')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('contabilidad.add_upe')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={true}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <ReusableTable
                        data={pageData.results}
                        columns={UPE_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('contabilidad.change_upe') ? handleEditClick : null,
                            onDelete: hasPermission('contabilidad.delete_upe') ? handleDeleteClick : null,
                            onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null
                        }}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay UPEs disponibles"
                    />
                </div>
            </div>

            <ReusableModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingUPE ? 'Editar UPE' : 'Nueva UPE'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="identificador">Identificador <span className="text-red-500">*</span></Label>
                            <Input id="identificador" value={formData.identificador} onChange={(e) => setFormData({ ...formData, identificador: e.target.value })} placeholder="Ej: A-101" required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="proyecto">Proyecto <span className="text-red-500">*</span></Label>
                            <Select value={formData.proyecto?.toString()} onValueChange={(value) => setFormData({ ...formData, proyecto: value })}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione proyecto" /></SelectTrigger>
                                <SelectContent>
                                    {proyectos.map(p => (<SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="nivel">Nivel <span className="text-red-500">*</span></Label>
                            <Input id="nivel" type="number" value={formData.nivel} onChange={(e) => setFormData({ ...formData, nivel: e.target.value })} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="metros_cuadrados">Metros Cuadrados <span className="text-red-500">*</span></Label>
                            <Input id="metros_cuadrados" type="number" step="0.01" value={formData.metros_cuadrados} onChange={(e) => setFormData({ ...formData, metros_cuadrados: e.target.value })} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="estacionamientos">Estacionamientos <span className="text-red-500">*</span></Label>
                            <Input id="estacionamientos" type="number" value={formData.estacionamientos} onChange={(e) => setFormData({ ...formData, estacionamientos: e.target.value })} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="valor_total">Valor Total <span className="text-red-500">*</span></Label>
                            <Input id="valor_total" type="number" step="0.01" value={formData.valor_total} onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="moneda">Moneda <span className="text-red-500">*</span></Label>
                            <Select value={formData.moneda} onValueChange={(value) => setFormData({ ...formData, moneda: value })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="MXN">MXN</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
                            <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Disponible">Disponible</SelectItem>
                                    <SelectItem value="Vendida">Vendida</SelectItem>
                                    <SelectItem value="Pagada">Pagada</SelectItem>
                                    <SelectItem value="Bloqueada">Bloqueada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar UPE')}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            <ReusableModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Desactivar UPE" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas desactivar la UPE <span className="font-semibold">{itemToDelete?.identificador}</span>?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">La UPE ya no aparecerá en las listas principales.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Desactivar</Button>
                    </div>
                </div>
            </ReusableModal>

            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={importarUPEs} onSuccess={() => { fetchData(currentPage, pageSize); toast.success('UPEs importadas exitosamente'); }} templateUrl="/contabilidad/upes/exportar-plantilla/" />
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} columns={UPE_COLUMNAS_EXPORT} selectedColumns={selectedColumns} onColumnChange={handleColumnChange} onDownload={handleExport} data={pageData.results} withPreview={true} />
        </div>
    );
}