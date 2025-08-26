// app/dashboard/page.jsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStrategicDashboardData, getAllProyectos } from '@/services/api';

// Componentes de UI
import Overlay from '@/components/loaders/Overlay';
import KpiCard from '@/components/ui/cards/Kpi';
import VentasChart from '@/components/charts/Ventas';
import FlujoCobranzaChart from '@/components/charts/FlujoCobranza';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de los filtros
  const [timeframe, setTimeframe] = useState('month');
  const [selectedProjects, setSelectedProjects] = useState('all');

  // --- 1. Lógica para obtener los datos ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, proyectosRes] = await Promise.all([
        getStrategicDashboardData(timeframe, selectedProjects.toString()),
        getAllProyectos(),
      ]);

      setDashboardData(dashboardRes.data);
      const projectList = proyectosRes.data?.results ?? proyectosRes.data ?? [];
      setProyectos(projectList);

    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
      // Aquí podrías añadir un estado para mostrar un mensaje de error en la UI
    } finally {
      setLoading(false);
    }
  }, [timeframe, selectedProjects]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. Transformación de datos para cada gráfica ---
  const ventasChartData = useMemo(() => {
    const labels = dashboardData?.chart?.labels ?? [];
    const ventas = dashboardData?.chart?.ventas ?? [];
    return labels.map((label, i) => ({
      label,
      Ventas: Number(ventas[i] ?? 0),
    }));
  }, [dashboardData]);

  const flujoChartData = useMemo(() => {
    const labels = dashboardData?.chart?.labels ?? [];
    const recuperado = dashboardData?.chart?.recuperado ?? [];
    const programado = dashboardData?.chart?.programado ?? [];
    return labels.map((label, i) => ({
      label,
      Cobrado: Number(recuperado[i] ?? 0),
      'Por Cobrar': Number(programado[i] ?? 0),
    }));
  }, [dashboardData]);


  if (loading && !dashboardData) {
    return <Overlay show />;
  }

  return (
    <div className="relative p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* --- Overlay de Carga --- */}
      <Overlay show={loading} />

      {/* --- Encabezado y Filtros --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Dashboard Estratégico
        </h1>
        <div className="flex items-center gap-4">
          {/* Aquí puedes mantener tus filtros como los tenías */}
          <select
            value={selectedProjects}
            onChange={(e) => setSelectedProjects(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
          >
            <option value="all">Todos los Proyectos</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- KPIs --- */}
      {dashboardData?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <KpiCard title="Total UPEs" value={dashboardData.kpis.upes_total} />
          <KpiCard title="Total en Ventas" value={dashboardData.kpis.ventas} />
          <KpiCard title="Total Recuperado" value={dashboardData.kpis.recuperado} />
          <KpiCard title="Monto por Cobrar" value={dashboardData.kpis.por_cobrar} />
          <KpiCard title="Monto en Morosidad" value={dashboardData.kpis.vencido} />
        </div>
      )}

      {/* --- Gráficas --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VentasChart data={ventasChartData} />
        <FlujoCobranzaChart data={flujoChartData} />
      </div>
    </div>
  );
}