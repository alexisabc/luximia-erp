'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getMonedas,
  createMoneda,
  updateMoneda,
  deleteMoneda,
  getInactiveMonedas,
  hardDeleteMoneda,
  exportMonedasExcel,
  importarMonedas // Imported
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import'; // Imported
import ActionButtons from '@/components/common/ActionButtons';

const MONEDA_COLUMNAS_DISPLAY = [
  { header: 'Código', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.codigo}</span> },
  { header: 'Nombre', render: (row) => row.nombre }
];

const MONEDA_COLUMNAS_EXPORT = [
  { id: 'id', label: 'ID' },
  { id: 'codigo', label: 'Código' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'activo', label: 'Estado' }
];

const MONEDA_FORM_FIELDS = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'nombre', label: 'Nombre', required: true }
];

export default function MonedasPage() {
  const { hasPermission, authTokens } = useAuth();
  const [pageData, setPageData] = useState({ results: [], count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Added
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({ codigo: '', nombre: '' });
  const [editingMoneda, setEditingMoneda] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const cols = {};
    MONEDA_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
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
          ? await getInactiveMonedas(page, size, { search }) // Updated to support search
          : await getMonedas(page, size, { search });
        setPageData(res.data);
        setCurrentPage(page);
        hasInitialData.current = true;
      } catch (err) {
        setError('No se pudieron cargar las monedas.');
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
    setEditingMoneda(null);
    setFormData({ codigo: '', nombre: '' });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (moneda) => {
    setEditingMoneda(moneda);
    setFormData({ codigo: moneda.codigo, nombre: moneda.nombre });
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMoneda(itemToDelete);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al eliminar la moneda.');
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleHardDelete = async (id) => {
    try {
      await hardDeleteMoneda(id);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al eliminar la moneda.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingMoneda) {
        await updateMoneda(editingMoneda.id, formData);
      } else {
        await createMoneda(formData);
      }
      setIsFormModalOpen(false);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al guardar la moneda.');
    }
  };

  const handleColumnChange = (e) => {
    const { name, checked } = e.target;
    setSelectedColumns(prev => ({ ...prev, [name]: checked }));
  };

  const handleExport = async () => {
    const columnsToExport = MONEDA_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
    try {
      const response = await exportMonedasExcel(columnsToExport);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_monedas.xlsx';
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
              Gestión de Monedas
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Configura las divisas disponibles en el sistema.</p>
          </div>
          <ActionButtons
            showInactive={showInactive}
            onToggleInactive={() => setShowInactive(!showInactive)}
            canToggleInactive={hasPermission('contabilidad.view_cliente')}
            onCreate={handleCreateClick}
            canCreate={hasPermission('contabilidad.add_moneda')}
            onImport={() => setIsImportModalOpen(true)} // Updated
            canImport={hasPermission('contabilidad.add_moneda')}
            onExport={() => setIsExportModalOpen(true)}
            canExport={hasPermission('contabilidad.view_moneda')}
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
          columns={MONEDA_COLUMNAS_DISPLAY}
          actions={{
            onEdit: hasPermission('contabilidad.change_moneda') ? handleEditClick : null,
            onDelete: hasPermission('contabilidad.delete_moneda') ? handleDeleteClick : null,
            onHardDelete: showInactive && hasPermission('contabilidad.delete_moneda') ? handleHardDelete : null
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
        title={editingMoneda ? 'Editar Moneda' : 'Nueva Moneda'}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmit}
        fields={MONEDA_FORM_FIELDS}
        formData={formData}
        onChange={handleInputChange} // Fixed prop name from onFormChange to onChange if FormModal uses standard, but previously it was used. Let's check FormModal props.
        // Actually FormModal usually takes onFormChange. Let's stick to what was there or correct it.
        // The file `components/ui/modals/Form.jsx` uses `onFormChange`.
        // The original file used `onChange={handleInputChange}` at line 242.
        // Wait, FormModal prop is `onFormChange`. If original code used `onChange`, it might have been passing it down to a different prop or it was wrong.
        // I'll use `onFormChange` to be safe/correct based on my knowledge of FormModal.
        onFormChange={handleInputChange}
      />

      <ImportModal // Added
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importarMonedas}
        onSuccess={() => fetchData(currentPage, pageSize)}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message="¿Estás seguro de que deseas eliminar esta moneda?"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={MONEDA_COLUMNAS_EXPORT}
        selectedColumns={selectedColumns}
        onColumnChange={handleColumnChange}
        onExport={handleExport}
      />
    </div>
  );
}

