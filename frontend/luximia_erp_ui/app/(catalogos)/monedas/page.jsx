'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getMonedas,
  createMoneda,
  updateMoneda,
  deleteMoneda,
  getInactiveMonedas,
  hardDeleteMoneda,
  exportMonedasExcel
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import ActionButtons from '@/components/ui/ActionButtons';

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
  const pageSize = 5;
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  const fetchData = useCallback(
    async (page, size) => {
      if (!authTokens || !size || size <= 0) return;
      pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
      try {
        const res = showInactive ? await getInactiveMonedas() : await getMonedas(page, size);
        setPageData(res.data);
        setCurrentPage(page);
      } catch (err) {
        setError('No se pudieron cargar las monedas.');
      } finally {
        setLoading(false);
        setIsPaginating(false);
      }
    },
    [authTokens, pageData.results.length, showInactive]
  );

  useEffect(() => {
    fetchData(1, pageSize);
  }, [fetchData]);

  const handlePageChange = (newPage) => {
    fetchData(newPage, pageSize);
  };

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
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Monedas</h1>
          <ActionButtons
            showInactive={showInactive}
            onToggleInactive={() => setShowInactive(!showInactive)}
            canToggleInactive={hasPermission('cxc.can_view_inactive_records')}
            onCreate={handleCreateClick}
            canCreate={hasPermission('cxc.add_moneda')}
            importHref="/importar/monedas"
            canImport={hasPermission('cxc.add_moneda')}
            onExport={() => setIsExportModalOpen(true)}
            canExport={hasPermission('cxc.view_moneda')}
          />
        </div>
        {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      </div>

      <div className="flex-grow min-h-0">
        <ReusableTable
          data={pageData.results}
          columns={MONEDA_COLUMNAS_DISPLAY}
          actions={{
            onEdit: hasPermission('cxc.change_moneda') ? handleEditClick : null,
            onDelete: hasPermission('cxc.delete_moneda') ? handleDeleteClick : null,
            onHardDelete: showInactive && hasPermission('cxc.delete_moneda') ? handleHardDelete : null
          }}
          pageSize={pageSize}
          currentPage={currentPage}
          totalCount={pageData.count}
          onPageChange={handlePageChange}
          loading={loading}
          isPaginating={isPaginating}
        />
      </div>

      <FormModal
        title={editingMoneda ? 'Editar Moneda' : 'Nueva Moneda'}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmit}
        fields={MONEDA_FORM_FIELDS}
        formData={formData}
        onChange={handleInputChange}
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
        onChange={handleColumnChange}
        onExport={handleExport}
      />
    </div>
  );
}

