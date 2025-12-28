'use client';

/**
 * Página de Gestión de Monedas - Actualizada v2.6
 * 
 * Características:
 * - ✅ Responsive (móvil → TV)
 * - ✅ Dark mode completo
 * - ✅ Stats cards con gradientes
 * - ✅ Toasts modernos (Sonner)
 * - ✅ Componentes reutilizables
 * - ✅ Iconos Lucide
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Coins, Plus, Loader2, DollarSign,
  TrendingUp, Globe, AlertCircle
} from 'lucide-react';

// Componentes
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Servicios
import {
  getMonedas,
  createMoneda,
  updateMoneda,
  deleteMoneda,
  getInactiveMonedas,
  hardDeleteMoneda,
  exportMonedasExcel,
  importarMonedas
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Modales legacy
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const MONEDA_COLUMNAS_DISPLAY = [
  {
    header: 'Moneda',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.nombre}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {row.codigo}
          </div>
        </div>
      </div>
    )
  },
  {
    header: 'Estado',
    render: (row) => (
      <Badge variant={row.activo ? 'success' : 'secondary'}>
        {row.activo ? 'Activa' : 'Inactiva'}
      </Badge>
    )
  }
];

const MONEDA_COLUMNAS_EXPORT = [
  { id: 'id', label: 'ID' },
  { id: 'codigo', label: 'Código' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'activo', label: 'Estado' }
];

export default function MonedasPage() {
  const { hasPermission, authTokens } = useAuth();

  // Estados
  const [pageData, setPageData] = useState({ results: [], count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({ codigo: '', nombre: '' });
  const [editingMoneda, setEditingMoneda] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const cols = {};
    MONEDA_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
    return cols;
  });

  const pageSize = 10;
  const hasInitialData = useRef(false);

  // Estadísticas calculadas
  const stats = [
    {
      label: 'Total Monedas',
      value: pageData.count || 0,
      icon: Coins,
      gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
    },
    {
      label: 'Activas',
      value: pageData.results?.filter(m => m.activo).length || 0,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
    },
    {
      label: 'Inactivas',
      value: pageData.results?.filter(m => !m.activo).length || 0,
      icon: AlertCircle,
      gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
    },
    {
      label: 'Divisas Globales',
      value: pageData.results?.length || 0,
      icon: Globe,
      gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
    }
  ];

  // Cargar datos
  const fetchData = useCallback(async (page, size, search = searchQuery) => {
    if (!authTokens || !size || size <= 0) return;

    if (hasInitialData.current) {
      setIsPaginating(true);
    } else {
      setLoading(true);
    }

    try {
      const res = showInactive
        ? await getInactiveMonedas(page, size, { search })
        : await getMonedas(page, size, { search });
      setPageData(res.data);
      setCurrentPage(page);
      hasInitialData.current = true;
    } catch (err) {
      console.error(err);
      toast.error('Error cargando monedas');
    } finally {
      setLoading(false);
      setIsPaginating(false);
    }
  }, [authTokens, showInactive, searchQuery]);

  useEffect(() => {
    fetchData(1, pageSize);
  }, [pageSize, fetchData]);

  // Handlers
  const handlePageChange = (newPage) => {
    fetchData(newPage, pageSize);
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    fetchData(1, pageSize, query);
  }, [fetchData, pageSize]);

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

  const handleDeleteClick = (moneda) => {
    setItemToDelete(moneda);
    setIsConfirmModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMoneda) {
        await updateMoneda(editingMoneda.id, formData);
        toast.success('Moneda actualizada exitosamente');
      } else {
        await createMoneda(formData);
        toast.success('Moneda creada exitosamente');
      }
      setIsFormModalOpen(false);
      fetchData(currentPage, pageSize);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la moneda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteMoneda(itemToDelete.id);
      toast.success('Moneda desactivada exitosamente');
      fetchData(currentPage, pageSize);
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la moneda');
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleHardDelete = async (id) => {
    try {
      await hardDeleteMoneda(id);
      toast.success('Moneda eliminada permanentemente');
      fetchData(currentPage, pageSize);
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la moneda');
    }
  };

  const handleColumnChange = (e) => {
    const { name, checked } = e.target;
    setSelectedColumns(prev => ({ ...prev, [name]: checked }));
  };

  const handleExport = async () => {
    const columnsToExport = MONEDA_COLUMNAS_EXPORT
      .filter(c => selectedColumns[c.id])
      .map(c => c.id);

    try {
      const response = await exportMonedasExcel(columnsToExport);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_monedas.xlsx';
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
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Gestión de Monedas
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Configura las divisas disponibles en el sistema
            </p>
          </div>

          <ActionButtons
            showInactive={showInactive}
            onToggleInactive={() => setShowInactive(!showInactive)}
            canToggleInactive={hasPermission('contabilidad.view_moneda')}
            onCreate={handleCreateClick}
            canCreate={hasPermission('contabilidad.add_moneda')}
            onImport={() => setIsImportModalOpen(true)}
            canImport={hasPermission('contabilidad.add_moneda')}
            onExport={() => setIsExportModalOpen(true)}
            canExport={hasPermission('contabilidad.view_moneda')}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`
                                bg-gradient-to-br ${stat.gradient}
                                rounded-xl p-4 sm:p-6
                                shadow-lg hover:shadow-xl
                                transition-all duration-300
                                transform hover:-translate-y-1
                            `}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-white/80">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="overflow-x-auto">
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
              onPageChange: handlePageChange
            }}
            loading={loading}
            isPaginating={isPaginating}
            onSearch={handleSearch}
            emptyMessage="No hay monedas disponibles"
          />
        </div>
      </div>

      {/* Modal de Formulario */}
      <ReusableModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingMoneda ? 'Editar Moneda' : 'Nueva Moneda'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código */}
          <div>
            <Label htmlFor="codigo">
              Código <span className="text-red-500">*</span>
            </Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="ej. USD, EUR, MXN"
              required
              maxLength={3}
              className="mt-1 uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Código ISO de 3 letras</p>
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="ej. Dólar Estadounidense"
              required
              className="mt-1"
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Moneda'
              )}
            </Button>
          </div>
        </form>
      </ReusableModal>

      {/* Modal de Confirmación */}
      <ReusableModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Desactivar Moneda"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                ¿Estás seguro de que deseas desactivar la moneda{' '}
                <span className="font-semibold">{itemToDelete?.nombre}</span>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                La moneda ya no aparecerá en las listas principales.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Desactivar
            </Button>
          </div>
        </div>
      </ReusableModal>

      {/* Modales de Import/Export */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importarMonedas}
        onSuccess={() => {
          fetchData(currentPage, pageSize);
          toast.success('Monedas importadas exitosamente');
        }}
        templateUrl="/contabilidad/monedas/exportar-plantilla/"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={MONEDA_COLUMNAS_EXPORT}
        selectedColumns={selectedColumns}
        onColumnChange={handleColumnChange}
        onDownload={handleExport}
        data={pageData.results}
        withPreview={true}
      />
    </div>
  );
}
