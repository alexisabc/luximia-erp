'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getFormasPago,
  createFormaPago,
  updateFormaPago,
  deleteFormaPago,
  getInactiveFormasPago,
  hardDeleteFormaPago,
  exportFormasPagoExcel,
  importarFormasPago // Imported
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import'; // Imported
import ActionButtons from '@/components/common/ActionButtons';

const COLUMNS_DISPLAY = [
  { header: 'Enganche (%)', render: (row) => row.enganche },
  { header: 'Mensualidades (%)', render: (row) => row.mensualidades },
  { header: 'Meses', render: (row) => row.meses },
  { header: 'Contra Entrega (%)', render: (row) => row.contra_entrega }
];

const COLUMNS_EXPORT = [
  { id: 'id', label: 'ID' },
  { id: 'enganche', label: 'Enganche' },
  { id: 'mensualidades', label: 'Mensualidades' },
  { id: 'meses', label: 'Meses' },
  { id: 'contra_entrega', label: 'Contra Entrega' },
  { id: 'activo', label: 'Estado' }
];

const FORM_FIELDS = [
  { name: 'enganche', label: 'Enganche (%)', type: 'number', required: true },
  { name: 'mensualidades', label: 'Mensualidades (%)', type: 'number', required: true },
  { name: 'meses', label: 'Meses', type: 'number', required: true },
  { name: 'contra_entrega', label: 'Contra Entrega (%)', type: 'number', required: true }
];

export default function FormasPagoPage() {
  const { hasPermission, authTokens } = useAuth();
  const [pageData, setPageData] = useState({ results: [], count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Added
  const [formData, setFormData] = useState({ enganche: '', mensualidades: '', meses: '', contra_entrega: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const cols = {};
    COLUMNS_EXPORT.forEach(c => (cols[c.id] = true));
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
          ? await getInactiveFormasPago(page, size, { search })
          : await getFormasPago(page, size, { search });
        setPageData(res.data);
        setCurrentPage(page);
        hasInitialData.current = true;
      } catch (err) {
        setError('No se pudieron cargar las formas de pago.');
      } finally {
        setLoading(false);
        setIsPaginating(false);
      }
    },
    [authTokens?.access, showInactive, searchQuery]
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
    setEditingItem(null);
    setFormData({ enganche: '', mensualidades: '', meses: '', contra_entrega: '' });
    setIsFormModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      enganche: item.enganche,
      mensualidades: item.mensualidades,
      meses: item.meses,
      contra_entrega: item.contra_entrega
    });
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteFormaPago(itemToDelete);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al eliminar la forma de pago.');
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleHardDelete = async (id) => {
    try {
      await hardDeleteFormaPago(id);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al eliminar definitivamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingItem) {
        await updateFormaPago(editingItem.id, formData);
      } else {
        await createFormaPago(formData);
      }
      setIsFormModalOpen(false);
      fetchData(currentPage, pageSize);
    } catch (err) {
      setError('Error al guardar la forma de pago.');
    }
  };

  const handleColumnChange = (e) => {
    const { name, checked } = e.target;
    setSelectedColumns(prev => ({ ...prev, [name]: checked }));
  };

  const handleExport = async () => {
    const columnsToExport = COLUMNS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
    try {
      const response = await exportFormasPagoExcel(columnsToExport);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_formas_pago.xlsx';
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
              Formas de Pago
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Configura las opciones de financiamiento y plazos.</p>
          </div>
          <ActionButtons
            showInactive={showInactive}
            onToggleInactive={() => setShowInactive(!showInactive)}
            canToggleInactive={hasPermission('contabilidad.view_cliente')}
            onCreate={handleCreateClick}
            canCreate={hasPermission('contabilidad.add_formapago')}
            onImport={() => setIsImportModalOpen(true)}
            canImport={hasPermission('contabilidad.add_formapago')}
            onExport={() => setIsExportModalOpen(true)}
            canExport={hasPermission('contabilidad.view_formapago')}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="flex-grow min-h-0">
        <ReusableTable
          data={pageData.results}
          columns={COLUMNS_DISPLAY}
          actions={{
            onEdit: hasPermission('contabilidad.change_formapago') ? handleEditClick : null,
            onDelete: hasPermission('contabilidad.delete_formapago') ? handleDeleteClick : null,
            onHardDelete: hasPermission('contabilidad.hard_delete') ? handleHardDelete : null,
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
        onSubmit={handleSubmit}
        title={editingItem ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
        fields={FORM_FIELDS}
        formData={formData}
        onFormChange={handleInputChange}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Seguro que deseas eliminar esta forma de pago?"
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importarFormasPago}
        onSuccess={() => fetchData(currentPage, pageSize)}
        templateUrl="/contabilidad/formas-pago/exportar-plantilla/"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={COLUMNS_EXPORT}
        selectedColumns={selectedColumns}
        onColumnChange={handleColumnChange}
        onExport={handleExport}
      />
    </div>
  );
}

