'use client';
import React, { useEffect, useState, useCallback } from 'react';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import { useAuth } from '@/context/AuthContext';
import { getAuditLogs, downloadAuditLogExcel } from '@/services/api';
import ActionButtons from '@/components/ui/ActionButtons';

const COLUMNAS = [
  { header: 'Usuario', render: row => row.user || '-' },
  { header: 'Acción', render: row => row.action },
  { header: 'Modelo', render: row => row.model_name },
  { header: 'ID', render: row => row.object_id },
  { header: 'Fecha', render: row => new Date(row.timestamp).toLocaleString() },
  { header: 'Cambios', render: row => row.changes },
];

export default function AuditoriaPage() {
  const { hasPermission } = useAuth();
  const [pageData, setPageData] = useState({ results: [], count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);

  const fetchLogs = useCallback(
    async (page, size, isPageChange = false) => {
      setError(null);
      isPageChange ? setIsPaginating(true) : setLoading(true);
      try {
        const res = await getAuditLogs(page, size);
        const data = res.data;
        const results = Array.isArray(data) ? data : data.results || [];
        const count = Array.isArray(data) ? data.length : data.count ?? results.length;
        setPageData({ results, count });
        setCurrentPage(page);
      } catch (err) {
        setError('No se pudieron cargar los registros.');
      } finally {
        setLoading(false);
        setIsPaginating(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLogs(1, pageSize);
  }, [fetchLogs]);

  const handlePageChange = (newPage) => {
    fetchLogs(newPage, pageSize, true);
  };

  const handleExport = async () => {
    try {
      const res = await downloadAuditLogExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'auditoria.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setError('Error al descargar el reporte.');
    }
  };

  if (!hasPermission('cxc.can_view_auditlog')) {
    return <div className="p-8">Sin permiso para ver auditoría.</div>;
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Auditoría</h1>
        <ActionButtons onExport={handleExport} canExport={hasPermission('cxc.can_view_auditlog')} />
      </div>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      <div className="flex-grow min-h-0">
        <ReusableTable
          data={pageData.results}
          columns={COLUMNAS}
          pagination={{
            currentPage,
            totalCount: pageData.count,
            pageSize,
            onPageChange: handlePageChange,
          }}
          loading={loading}
          isPaginating={isPaginating}
        />
      </div>
    </div>
  );
}
