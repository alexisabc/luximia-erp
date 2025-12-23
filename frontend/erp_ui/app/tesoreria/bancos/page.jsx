'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getBancos,
  createBanco,
  updateBanco,
  deleteBanco,
  getInactiveBancos,
  hardDeleteBanco,
  exportBancosExcel,
  importarBancos // Imported
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import'; // Imported
import ActionButtons from '@/components/common/ActionButtons';

const BANCO_COLUMNAS_DISPLAY = [
  { header: 'Clave', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.clave}</span> },
  { header: 'Nombre Corto', render: (row) => row.nombre_corto },
  { header: 'Razón Social', render: (row) => row.razon_social }
];

const BANCO_COLUMNAS_EXPORT = [
  { id: 'id', label: 'ID' },
  { id: 'clave', label: 'Clave' },
  { id: 'nombre_corto', label: 'Nombre Corto' },
  { id: 'razon_social', label: 'Razón Social' },
  { id: 'activo', label: 'Estado' }
];

const BANCO_FORM_FIELDS = [
  { name: 'clave', label: 'Clave', required: true },
  { name: 'nombre_corto', label: 'Nombre Corto', required: true },
  { name: 'razon_social', label: 'Razón Social', required: true }
];

export default function BancosPage() {
  const { hasPermission, authTokens } = useAuth();
  const [pageData, setPageData] = useState({ results: [], count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Added
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({ clave: '', nombre_corto: '', razon_social: '' });
  const [editingBanco, setEditingBanco] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const cols = {};
    BANCO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
    return cols;
  });
  const [loading, setLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hasInitialData = React.useRef(false);

  const fetchData = useCallback(
    async (page, size, search = searchQuery) => {
      if (!authTokens || !size || size <= 0) return;

      if (hasInitialData.current) {
        setIsPaginating(true);
      } else {
        setLoading(true);
      }

      try {
        const res = showInactive
          ? await getInactiveBancos(page, size, { search }) // Updated
          : await getBancos(page, size, { search });
        setPageData(res.data);
        setCurrentPage(page);
        hasInitialData.current = true;
      } catch (err) {
        setError('No se pudieron cargar los bancos.');
      } finally {
        setLoading(false);
        setIsPaginating(false);
      }
    },
    [authTokens, showInactive, searchQuery]
  );

  useEffect(() => {
    fetchData(1, pageSize);
  }, [pageSize, fetchData]);

  const handlePageChange = (newPage) => {
    fetchData(newPage, pageSize);
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    fetchData(1, pageSize, query);
  }, [fetchData, pageSize]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateClick = () => {
    setEditingBanco(null);
    setFormData({ clave: '', nombre_corto: '', razon_social: '' });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (banco) => {
    setEditingBanco(banco);
    setFormData({ clave: banco.clave, nombre_corto: banco.nombre_corto, razon_social: banco.razon_social });
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteBanco(itemToDelete);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al eliminar el banco.');
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleHardDelete = async (id) => {
    try {
      await hardDeleteBanco(id);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al eliminar definitivamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingBanco) {
        await updateBanco(editingBanco.id, formData);
      } else {
        await createBanco(formData);
      }
      setIsFormModalOpen(false);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al guardar el banco.');
    }
  };

  const handleColumnChange = (e) => {
    const { name, checked } = e.target;
    setSelectedColumns(prev => ({ ...prev, [name]: checked }));
  };

  const handleExport = async () => {
    const columnsToExport = BANCO_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
    try {
      const response = await exportBancosExcel(columnsToExport);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_bancos.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
    } catch (err) {
      setError('No se pudo exportar el archivo.');
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Gestión de Bancos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Administra el catálogo de instituciones bancarias.</p>
          </div>
          <ActionButtons
            showInactive={showInactive}
            onToggleInactive={() => setShowInactive(!showInactive)}
            canToggleInactive={hasPermission('contabilidad.view_cliente')}
            onCreate={handleCreateClick}
            canCreate={hasPermission('contabilidad.add_banco')}
            onImport={() => setIsImportModalOpen(true)} // Updated
            canImport={hasPermission('contabilidad.add_banco')}
            onExport={() => setIsExportModalOpen(true)}
            canExport={hasPermission('contabilidad.view_banco')}
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
          columns={BANCO_COLUMNAS_DISPLAY}
          actions={{
            onEdit: hasPermission('contabilidad.change_banco') ? handleEditClick : null,
            onDelete: hasPermission('contabilidad.delete_banco') ? handleDeleteClick : null,
            onHardDelete: showInactive && hasPermission('contabilidad.delete_banco') ? handleHardDelete : null
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
        title={editingBanco ? 'Editar Banco' : 'Nuevo Banco'}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmit}
        fields={BANCO_FORM_FIELDS}
        formData={formData}
        onFormChange={handleInputChange} // Fixed prop
      />

      <ImportModal // Added
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importarBancos}
        onSuccess={() => fetchData(currentPage, pageSize)}
        templateUrl="/contabilidad/bancos/exportar-plantilla/"
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message="¿Estás seguro de que deseas eliminar este banco?"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={BANCO_COLUMNAS_EXPORT}
        selectedColumns={selectedColumns}
        onColumnChange={handleColumnChange} // Fixed prop name to match ExportModal standard if needed (check ExportModal.jsx later if errors)
        onExport={handleExport}
      />
    </div>
  );
}

