// app/upes/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUPEs, getAllProyectos, createUPE, updateUPE, deleteUPE, getInactiveUpes, hardDeleteUpe, exportUpesExcel } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import FormModal from '../../components/FormModal';
import ExportModal from '../../components/ExportModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';
import { formatCurrency } from '../../utils/formatters';
import { Download } from 'lucide-react';

// ### 2. Define las columnas para la tabla y la exportación ###
const UPE_COLUMNAS_DISPLAY = [
    { header: 'Identificador', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.identificador}</span> },
    { header: 'Proyecto', render: (row) => <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{row.proyecto_nombre}</span> },
    { header: 'Estado', render: (row) => row.estado },
    { header: 'Valor Total', render: (row) => <div className="text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(row.valor_total, row.moneda)}</div> },
];

const UPE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'proyecto__nombre', label: 'Proyecto' },
    { id: 'identificador', label: 'Identificador' },
    { id: 'valor_total', label: 'Valor Total' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'estado', label: 'Estado' },
];

const UPE_FORM_FIELDS = [
    { name: 'identificador', label: 'Identificador', required: true },
    { name: 'proyecto', label: 'Proyecto', type: 'select', options: [], required: true }, // Las opciones se llenarán dinámicamente
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
    const pageSize = 5;
    const [error, setError] = useState(null);

    // Estados para los modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estados para la gestión de datos
    const [formData, setFormData] = useState({ identificador: '', valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: '' });
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

    const upeFormFields = UPE_FORM_FIELDS.map(field => {
        if (field.name === 'proyecto') {
            return { ...field, options: proyectos.map(p => ({ value: p.id, label: p.nombre })) };
        }
        return field;
    });

    const handleCreateClick = () => {
        setEditingUPE(null);
        setFormData({ identificador: '', valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: '' });
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

    
    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
        try {
            const [upesRes, proyectosRes] = await Promise.all([
                showInactive ? getInactiveUpes() : getUPEs(page, size),
                getAllProyectos()
            ]);
            setPageData(upesRes.data);
            setProyectos(proyectosRes.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive]);

    useEffect(() => { if (pageSize > 0) { fetchData(1, pageSize); } }, [pageSize,fetchData]);

    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };

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
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de UPEs</h1>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.can_view_inactive_records') && (
                        <button onClick={() => setShowInactive(!showInactive)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                            {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                        </button>
                    )}
                    {hasPermission('cxc.add_upe') && <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Nueva UPE</button>}
                    <button onClick={() => setIsExportModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg" title="Exportar a Excel"><Download className="h-6 w-6" /></button>
                </div>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={UPE_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_upe') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_upe') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null
                    }}
                />
            </div>

            <div className="flex-shrink-0 flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Total: {pageData.count} registros
                </span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pageData.previous}
                        className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pageData.next}
                        className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        Siguiente
                    </button>
                </div>
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