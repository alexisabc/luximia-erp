'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUPEs, getAllProyectos, createUPE, updateUPE, deleteUPE, getInactiveUpes, hardDeleteUpe, exportUpesExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/ui/modals/Form';
import ExportModal from '@/components/ui/modals/Export';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import { formatCurrency } from '@/utils/formatters';
import ActionButtons from '@/components/common/ActionButtons';

// ### 2. Define las columnas para la tabla y la exportación ###
const UPE_COLUMNAS_DISPLAY = [
    { header: 'Identificador', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.identificador}</span> },
    { header: 'Proyecto', render: (row) => <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{row.proyecto_nombre}</span> },
    { header: 'Nivel', render: (row) => row.nivel },
    { header: 'm²', render: (row) => row.metros_cuadrados },
    { header: 'Estacionamientos', render: (row) => row.estacionamientos },
    {
        header: 'Estado',
        render: (row) => {
            const statusStyles = {
                'Disponible': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                'Vendida': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                'Pagada': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                'Bloqueada': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            };
            return (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${statusStyles[row.estado] || 'bg-gray-100 text-gray-800'}`}>
                    {row.estado}
                </span>
            );
        }
    },
    { header: 'Valor Total', render: (row) => <div className="text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(row.valor_total, row.moneda)}</div> },
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
    { id: 'estado', label: 'Estado' },
];

const UPE_FORM_FIELDS = [
    { name: 'identificador', label: 'Identificador', required: true },
    { name: 'proyecto', label: 'Proyecto', type: 'select', options: [], required: true }, // Las opciones se llenarán dinámicamente
    { name: 'nivel', label: 'Nivel', type: 'number', required: true },
    { name: 'metros_cuadrados', label: 'Metros cuadrados', type: 'number', required: true },
    { name: 'estacionamientos', label: 'Estacionamientos', type: 'number', required: true },
    { name: 'valor_total', label: 'Valor Total', type: 'number', required: true },
    { name: 'moneda', label: 'Moneda', type: 'select', options: [{ value: 'USD', label: 'USD' }, { value: 'MXN', label: 'MXN' }], required: true },
    {
        name: 'estado', label: 'Estado', type: 'select', options: [
            { value: 'Disponible', label: 'Disponible' }, { value: 'Vendida', label: 'Vendida' },
            { value: 'Pagada', label: 'Pagada' }, { value: 'Bloqueada', label: 'Bloqueada' }
        ], required: true
    },
];

export default function UPEsPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [proyectos, setProyectos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [error, setError] = useState(null);

    // Estados para los modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estados para la gestión de datos
    const [formData, setFormData] = useState({ identificador: '', nivel: '', metros_cuadrados: '', estacionamientos: '', valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: '' });
    const [editingUPE, setEditingUPE] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        UPE_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const hasInitialData = React.useRef(false);

    const upeFormFields = UPE_FORM_FIELDS.map(field => {
        if (field.name === 'proyecto') {
            return { ...field, options: proyectos.map(p => ({ value: p.id, label: p.nombre })) };
        }
        return field;
    });

    const handleCreateClick = () => {
        setEditingUPE(null);
        setFormData({ identificador: '', nivel: '', metros_cuadrados: '', estacionamientos: '', valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (upe) => {
        setEditingUPE(upe);
        setFormData({ ...upe, proyecto: upe.proyecto });
        setIsFormModalOpen(true);
    };

    // ### 3. Reemplaza handleDeleteClick y añade handleConfirmDelete ###
    const handleDeleteClick = (upeId) => {
        setItemToDelete(upeId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteUPE(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar. La UPE podría tener un contrato asociado.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteUpe(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleExport = async () => {
        const columnsToExport = UPE_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

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
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };


    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };


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
                    ? getInactiveUpes(page, size)
                    : getUPEs(page, size, { search }),
                getAllProyectos()
            ]);
            setPageData(upesRes.data);
            setProyectos(proyectosRes.data.results || proyectosRes.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            setError('No se pudieron cargar las UPEs.');
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUPE) {
                await updateUPE(editingUPE.id, formData);
            } else {
                await createUPE(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessages = errorData ? Object.values(errorData).flat().join(', ') : 'Error al guardar la UPE.';
            setError(errorMessages);
        }
    };

    // Función para obtener el estilo del badge según el nombre del proyecto
    const getProjectBadgeStyle = (projectName) => {
        // Puedes añadir más proyectos y colores aquí
        switch (projectName.toLowerCase()) {
            case 'shark tower':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'be towers':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'torre medica':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };


    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Gestión de UPEs
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Administra las unidades privativas y su disponibilidad.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_cliente')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_upe')}
                        importHref="/importar/upes"
                        canImport={hasPermission('contabilidad.add_upe')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport
                    />
                </div>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={UPE_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('contabilidad.change_upe') ? handleEditClick : null,
                        onDelete: hasPermission('contabilidad.delete_upe') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null
                    }}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: handlePageChange,
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
                    onSearch={handleSearch}
                />
            </div>


            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingUPE ? 'Editar UPE' : 'Crear Nueva UPE'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={upeFormFields}
                submitText="Guardar UPE"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={UPE_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar UPE"
                message="¿Estás seguro de que deseas desactivar este upe? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}