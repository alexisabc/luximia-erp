// app/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// ### 1. Se elimina 'getUpeStatusChartData' ###
import { getStrategicDashboardData, getAllProyectos } from '../../services/api';
import { Bar } from 'react-chartjs-2';



const KpiCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
      ${parseFloat(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-full flex flex-col">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
    <div className="flex-grow flex items-center justify-center h-64">
      {children}
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Estados de los filtros
  const [timeframe, setTimeframe] = useState('month');
  const [selectedProjects, setSelectedProjects] = useState('all');
  const [morosidadRange, setMorosidadRange] = useState('30');
  const [porCobrarRange, setPorCobrarRange] = useState('30');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, proyectosRes] = await Promise.all([
        getStrategicDashboardData(timeframe, selectedProjects, morosidadRange, porCobrarRange),
        getAllProyectos()
      ]);

      setData(dashboardRes.data);
      setProyectos(proyectosRes.data);

    } catch (error) {
      console.error("Error al cargar datos del dashboard", error);
    } finally {
      setLoading(false);
    }
  }, [timeframe, selectedProjects, morosidadRange, porCobrarRange]);

  useEffect(() => {
    fetchData().then(() => setInitialLoad(false));
  }, [fetchData]);

  const ventasChartData = {
    labels: data?.chart?.labels || [],
    datasets: [
      { type: 'bar', label: 'Ventas', data: data?.chart?.ventas || [], backgroundColor: '#4BC0C0' }
    ]
  };

  const cobranzaChartData = {
    labels: data?.chart?.labels || [],
    datasets: [
      { type: 'bar', label: 'Cobrado', data: data?.chart?.recuperado || [], backgroundColor: '#36A2EB' },
      { type: 'bar', label: 'Por Cobrar', data: data?.chart?.programado || [], backgroundColor: '#FFCD56' }
    ]
  };

  if (loading && initialLoad) return <div className="p-8">Cargando dashboard...</div>;

  return (
    <div className="relative p-8 space-y-8">
      {loading && !initialLoad && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-20">
          <span className="text-gray-700 dark:text-gray-200 animate-pulse">Actualizando...</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Dashboard Estratégico</h1>
        {/* --- Filtros --- */}
        <div className="flex items-center gap-4">
          <select multiple value={selectedProjects === 'all' ? [] : selectedProjects} onChange={(e) => {
            const values = Array.from(e.target.selectedOptions).map(o => o.value);
            if (values.includes('all')) {
              setSelectedProjects('all');
            } else {
              setSelectedProjects(values);
            }
          }} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2">
            <option value="all">Todos los Proyectos</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md p-1">
            <button onClick={() => setTimeframe('week')} className={`px-3 py-1 rounded-md ${timeframe === 'week' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Semanal</button>
            <button onClick={() => setTimeframe('month')} className={`px-3 py-1 rounded-md ${timeframe === 'month' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Mensual</button>
            <button onClick={() => setTimeframe('year')} className={`px-3 py-1 rounded-md ${timeframe === 'year' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Anual</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Morosidad:</span>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md p-1">
              {['30','60','90','mas'].map(val => (
                <button key={val} onClick={() => setMorosidadRange(val)} className={`px-2 py-1 rounded-md ${morosidadRange === val ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>{val === 'mas' ? '90+' : val}</button>
              ))}
            </div>
            <span className="text-sm ml-2">Por Cobrar:</span>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md p-1">
              {['30','60','90','mas'].map(val => (
                <button key={val} onClick={() => setPorCobrarRange(val)} className={`px-2 py-1 rounded-md ${porCobrarRange === val ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>{val === 'mas' ? '90+' : val}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- KPIs --- */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <KpiCard title="Total UPEs" value={data.kpis.upes_total} />
          <KpiCard title="Total en Ventas" value={data.kpis.ventas} />
          <KpiCard title="Total Recuperado (Cobrado)" value={data.kpis.recuperado} />
          <KpiCard title="Monto por Cobrar" value={data.kpis.por_cobrar} />
          <KpiCard title="Monto en Morosidad" value={data.kpis.vencido} />
        </div>
      )}

      {/* --- Gráficas --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Ventas">
          <Bar data={ventasChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </ChartCard>
        <ChartCard title="Cobrado vs Por Cobrar">
          <Bar data={cobranzaChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </ChartCard>
      </div>

    </div>
  );
}