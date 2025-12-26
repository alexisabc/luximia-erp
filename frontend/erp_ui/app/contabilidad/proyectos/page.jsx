// app/proyectos/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getProyectos, createProyecto, updateProyecto, deleteProyecto, getInactiveProyectos, hardDeleteProyecto, exportProyectosExcel, importarProyectos } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form'; // <-- Usa el FormModal
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';
import ConfirmationModal from '@/components/modals/Confirmation';
import ActionButtons from '@/components/common/ActionButtons';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import { formatCurrency } from '@/utils/formatters';


const PROYECTO_COLUMNAS_DISPLAY = [
    { header: 'Nombre del Proyecto', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre}</span> },
    { header: 'Descripción', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.descripcion}</span> },
    { header: 'Niveles', render: (row) => row.niveles },
    { header: 'UPEs', render: (row) => row.numero_upes },
    { header: 'm²', render: (row) => row.metros_cuadrados },
    { header: 'Estacionamientos', render: (row) => row.numero_estacionamientos },
    { header: 'Valor Total', render: (row) => <div className="text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(row.valor_total, 'MXN')}</div> },
    {
        header: 'Estado',
        render: (row) => {
            const statusStyles = {
                'Planificado': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                'En venta': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                'Terminado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            };
            return (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${statusStyles[row.estado] || 'bg-gray-100 text-gray-800'}`}>
                    {row.estado}
                </span>
            );
        }
    },
];

const PROYECTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'niveles', label: 'Niveles' },
    { id: 'numero_upes', label: 'Número de UPEs' },
    { id: 'metros_cuadrados', label: 'Metros cuadrados' },
    { id: 'numero_estacionamientos', label: 'Número de Estacionamientos' },
    { id: 'valor_total', label: 'Valor Total' },
    { id: 'estado', label: 'Estado' },
    { id: 'activo', label: 'Activo' },
];


const PROYECTO_FORM_FIELDS = [
    { name: 'nombre', label: 'Nombre del Proyecto', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'niveles', label: 'Niveles', type: 'number' },
    { name: 'numero_upes', label: 'Número de UPEs', type: 'number' },
    { name: 'metros_cuadrados', label: 'Metros cuadrados', type: 'number' },
    { name: 'numero_estacionamientos', label: 'Número de Estacionamientos', type: 'number' },
    { name: 'valor_total', label: 'Valor Total', type: 'number' },
    {
        name: 'estado',
        label: 'Estado',
        type: 'select',
        options: [
            { value: 'Planificado', label: 'Planificado' },
            { value: 'En venta', label: 'En venta' },
            { value: 'Terminado', label: 'Terminado' },
        ],
    },
];

export default function ProyectosPage() {
    const { hasPermission, authTokens } = useAuth();

    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [error, setError] = useState(null);

    // Estados para los modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estados para la gestión de datos
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        niveles: '',
        numero_upes: '',
        metros_cuadrados: '',
        numero_estacionamientos: '',
        valor_total: '',
        estado: 'Planificado',
    });
    const [editingProject, setEditingProject] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        PROYECTO_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const hasInitialData = React.useRef(false);

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveProyectos(page, size, { search })
                : await getProyectos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            setError('No se pudieron cargar los proyectos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => { if (pageSize > 0) { fetchData(1, pageSize); } }, [pageSize, fetchData]);


    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreateClick = () => {
        setEditingProject(null);
        setFormData({
            nombre: '',
            descripcion: '',
            niveles: '',
            numero_upes: '',
            metros_cuadrados: '',
            numero_estacionamientos: '',
            valor_total: '',
            estado: 'Planificado',
        });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (proyecto) => {
        setEditingProject(proyecto);
        setFormData({
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion || '',
            niveles: proyecto.niveles || '',
            numero_upes: proyecto.numero_upes || '',
            metros_cuadrados: proyecto.metros_cuadrados || '',
            numero_estacionamientos: proyecto.numero_estacionamientos || '',
            valor_total: proyecto.valor_total || '',
            estado: proyecto.estado || 'Planificado',
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (proyectoId) => {
        setItemToDelete(proyectoId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteProyecto(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el proyecto.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteProyecto(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingProject) {
                await updateProyecto(editingProject.id, formData);
            } else {
                await createProyecto(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el proyecto.');
            console.error(err);
        }
    };

    const handleExport = async () => {
        const columnsToExport = PROYECTO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportProyectosExcel(columnsToExport);

            // ### LÓGICA PARA CREAR Y DESCARGAR EL BLOB ###
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_proyectos.xlsx'; // Puedes hacer este nombre dinámico si quieres
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            // ### FIN DE LA LÓGICA ###
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };


    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Gestión de Proyectos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Administra el catálogo de proyectos activos e inactivos.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_proyecto')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_proyecto')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('contabilidad.add_proyecto')}
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
                {/* ### CAMBIO 4: Se añade la prop 'actions' a la tabla ### */}
                <ReusableTable
                    data={pageData.results}
                    columns={PROYECTO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('contabilidad.change_proyecto') ? handleEditClick : null,
                        onDelete: hasPermission('contabilidad.delete_proyecto') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null,
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
                title={editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={PROYECTO_FORM_FIELDS}
                submitText="Guardar Proyecto"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={PROYECTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarProyectos}
                onSuccess={() => fetchData(currentPage, pageSize)}
                templateUrl="/contabilidad/proyectos/exportar-plantilla/"
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Proyecto"
                message="¿Estás seguro de que deseas desactivar este Proyecto? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}
