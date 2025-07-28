'use client';
import React, { useEffect, useState } from 'react';
import ReusableTable from '../../components/ReusableTable';
import { useAuth } from '../../context/AuthContext';
import { getAuditLogs, downloadAuditLogExcel } from '../../services/api';

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
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await getAuditLogs();
        setLogs(res.data);
      } catch (err) {
        setError('No se pudieron cargar los registros.');
      }
    };
    fetchLogs();
  }, []);

  const handleDownload = async () => {
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
        <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Descargar Excel</button>
      </div>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      <div className="flex-grow min-h-0">
        <ReusableTable data={logs} columns={COLUMNAS} />
      </div>
    </div>
  );
}
