'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getFormasPago,
  createFormaPago,
  updateFormaPago,
  deleteFormaPago,
  getInactiveFormasPago,
  hardDeleteFormaPago,
  exportFormasPagoExcel
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import { Download, Upload } from 'lucide-react';

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
  const pageSize = 5;
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
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

  const fetchData = useCallback(
    async (page, size) => {
      if (!authTokens || !size || size <= 0) return;
      pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
      try {
        const res = showInactive ? await getInactiveFormasPago() : await getFormasPago(page, size);
        setPageData(res.data);
        setCurrentPage(page);
      } catch (err) {
        setError('No se pudieron cargar las formas de pago.');
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
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Formas de Pago</h1>
          <div className="flex items-center space-x-3">
            {hasPermission('cxc.can_view_inactive_records') && (
              <button
                onClick={() => setShowInactive(!showInactive)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
              </button>
            )}
            {hasPermission('cxc.add_formapago') && (
              <button
                onClick={handleCreateClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                + Nueva Forma
              </button>
            )}
            {hasPermission('cxc.add_formapago') && (
              <Link
                href="/importar/formas-pago"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg transition-colors duration-200"
                title="Importar desde Excel"
              >
                <Upload className="h-6 w-6" />
              </Link>
            )}
            {hasPermission('cxc.view_formapago') && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg transition-colors duration-200"
                title="Exportar a Excel"
              >
                <Download className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

      <div className="flex-grow min-h-0">
        <ReusableTable
          data={pageData.results}
          columns={COLUMNS_DISPLAY}
          onEdit={hasPermission('cxc.change_formapago') ? handleEditClick : null}
          onDelete={hasPermission('cxc.delete_formapago') ? handleDeleteClick : null}
          currentPage={currentPage}
          totalCount={pageData.count}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
          isPaginating={isPaginating}
          showInactive={showInactive}
          onHardDelete={hasPermission('cxc.hard_delete') ? handleHardDelete : null}
        />
      </div>

      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingItem ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
        fields={FORM_FIELDS}
        formData={formData}
        onChange={handleInputChange}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Seguro que deseas eliminar esta forma de pago?"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={COLUMNS_EXPORT}
        selectedColumns={selectedColumns}
        onChange={handleColumnChange}
        onExport={handleExport}
      />
    </div>
  );
}

