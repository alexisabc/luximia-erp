// app/page.js o app/dashboard/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { getDashboardStats, getValorPorProyectoChartData, getUpeStatusChartData } from '../services/api';
import KpiCard from '../components/KpiCard';
import ValorPorProyectoChart from '../components/ValorPorProyectoChart';
import UpeStatusChart from '../components/UpeStatusChart';
import ChatInteligente from '../components/ChatInteligente';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [valorProyectoData, setValorProyectoData] = useState(null);
  const [upeStatusData, setUpeStatusData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Añadimos un estado de carga general

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, valorProyectoRes, upeStatusRes] = await Promise.all([
          getDashboardStats(),
          getValorPorProyectoChartData(),
          getUpeStatusChartData()
        ]);
        setStats(statsRes.data);
        setValorProyectoData(valorProyectoRes.data);
        setUpeStatusData(upeStatusRes.data);
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard.');
        console.error(err);
      } finally {
        setLoading(false); // La carga termina, con o sin error
      }
    };
    fetchData();
  }, []);

  return (
    // ### CAMBIO: Fondo principal y color de texto para modo oscuro ###
    <div className="p-8 bg-gray-100 dark:bg-gray-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">Dashboard</h1>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
      ) : (
        <>
          {/* --- Sección de KPIs --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Proyectos Activos" value={stats.proyectos_activos} />
            <KpiCard title="Clientes Totales" value={stats.clientes_totales} />
            <KpiCard title="UPEs Totales" value={stats.upes_totales} />
            <KpiCard title="Valor Total en Contratos (MXN Aprox.)" value={stats.valor_total_contratos_mxn} formatAsCurrency={true} />
          </div>

            {/* --- Sección de Gráficas --- */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-12">

              {/* Contenedor Gráfica de Barras */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valor Contratado por Proyecto</h3>
                {/* Div extra para controlar el tamaño de la gráfica */}
                <div className="flex-grow relative">
                  {valorProyectoData ? <ValorPorProyectoChart chartData={valorProyectoData} /> : <p className="text-gray-500">Cargando...</p>}
                </div>
              </div>

              {/* Contenedor Gráfica de Dona */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado de UPEs</h3>
                {/* Div extra para controlar el tamaño de la gráfica */}
                <div className="flex-grow relative">
                  {upeStatusData ? <UpeStatusChart chartData={upeStatusData} /> : <p className="text-gray-500">Cargando...</p>}
                </div>
              </div>

            </div>
        </>
      )}

      <ChatInteligente />
    </div>
  );
}