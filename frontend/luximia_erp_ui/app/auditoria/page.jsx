'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAuditLogs, downloadAuditLogExcel } from '@/services/api';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function AuditoriaPage() {
  const { hasPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAuditLogs(page, pageSize, { search });
      setAuditLogs(data.results || []);
      setTotalItems(data.count || 0);
    } catch (err) {
      console.error(err);
      toast.error('Error cargando auditoría');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const res = await downloadAuditLogExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'auditoria.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Error al descargar reporte');
    }
  };

  const columns = [
    {
      header: 'Usuario',
      accessorKey: 'user',
      cell: r => (
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-foreground">
            {typeof r.user === 'object' ? (r.user?.email || r.user?.username || JSON.stringify(r.user)) : r.user || 'Sistema'}
          </span>
        </div>
      )
    },
    {
      header: 'Acción',
      accessorKey: 'action',
      cell: r => {
        const actionLabel = String(r.action).toLowerCase();
        let variant = 'secondary';
        if (actionLabel.includes('creat')) variant = 'success';
        if (actionLabel.includes('updat') || actionLabel.includes('edit')) variant = 'warning';
        if (actionLabel.includes('delet')) variant = 'destructive';

        return <Badge variant={variant} className="capitalize">{String(r.action)}</Badge>;
      }
    },
    {
      header: 'Recurso',
      accessorKey: 'model_name',
      cell: r => (
        <div className="flex flex-col">
          <span className="font-medium capitalize">{r.model_name}</span>
          <span className="text-xs text-muted-foreground font-mono">ID: {r.object_id}</span>
        </div>
      )
    },
    {
      header: 'Fecha',
      accessorKey: 'timestamp',
      cell: r => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          {moment(r.timestamp).format('DD/MM/YYYY HH:mm:ss')}
        </div>
      )
    },
    {
      header: 'Cambios',
      accessorKey: 'changes',
      cell: r => {
        if (!r.changes) return <span className="text-muted-foreground text-xs italic">Sin cambios</span>;
        const changesStr = typeof r.changes === 'object' ? JSON.stringify(r.changes, null, 1) : String(r.changes);
        return (
          <code className="text-xs font-mono bg-muted p-1 rounded block max-w-[200px] truncate" title={changesStr}>
            {changesStr}
          </code>
        );
      }
    },
  ];

  if (!hasPermission('auditoria.view_auditlog')) {
    return (
      <div className="p-8 h-full flex items-center justify-center text-muted-foreground">
        <ShieldAlert className="w-12 h-12 mb-4 text-destructive/50" />
        <p>No tienes permisos para ver el registro de auditoría.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Auditoría del Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro detallado de actividades y seguridad.</p>
        </div>
        <ActionButtons
          onExport={handleExport}
          canExport={true}
        />
      </div>

      <div className="flex-grow min-h-0">
        <ReusableTable
          data={auditLogs}
          columns={columns}
          loading={loading}
          onSearch={setSearch}
          pagination={{
            currentPage: page,
            totalCount: totalItems,
            pageSize: pageSize,
            onPageChange: setPage
          }}
        />
      </div>
    </div>
  );
}
