'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getBancos,
  createBanco,
  updateBanco,
  deleteBanco,
  getInactiveBancos,
  hardDeleteBanco,
  exportBancosExcel
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import ActionButtons from '@/components/ui/ActionButtons';

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
  const pageSize = 5;
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  const fetchData = useCallback(
    async (page, size) => {
      if (!authTokens || !size || size <= 0) return;
      pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
      try {
        const res = showInactive ? await getInactiveBancos() : await getBancos(page, size);
        setPageData(res.data);
        setCurrentPage(page);
      } catch (err) {
        setError('No se pudieron cargar los bancos.');
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
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Bancos</h1>
          <ActionButtons
            showInactive={showInactive}
            onToggleInactive={() => setShowInactive(!showInactive)}
            canToggleInactive={hasPermission('cxc.can_view_inactive_records')}
            onCreate={handleCreateClick}
            canCreate={hasPermission('cxc.add_banco')}
            importHref="/importar/bancos"
            canImport={hasPermission('cxc.add_banco')}
            onExport={() => setIsExportModalOpen(true)}
            canExport={hasPermission('cxc.view_banco')}
          />
        </div>
        {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      </div>

      <div className="flex-grow min-h-0">
        <ReusableTable
          data={pageData.results}
          columns={BANCO_COLUMNAS_DISPLAY}
          actions={{
            onEdit: hasPermission('cxc.change_banco') ? handleEditClick : null,
            onDelete: hasPermission('cxc.delete_banco') ? handleDeleteClick : null,
            onHardDelete: showInactive && hasPermission('cxc.delete_banco') ? handleHardDelete : null
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
        title={editingBanco ? 'Editar Banco' : 'Nuevo Banco'}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmit}
        fields={BANCO_FORM_FIELDS}
        formData={formData}
        onChange={handleInputChange}
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
        onChange={handleColumnChange}
        onExport={handleExport}
      />
    </div>
  );
}

