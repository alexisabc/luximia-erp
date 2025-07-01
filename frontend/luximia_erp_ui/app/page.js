// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { getDashboardStats, getValorPorProyectoChartData } from '../services/api'; // Importamos nuestra función
import KpiCard from '../components/KpiCard'; // Importamos nuestro nuevo componente
import ValorPorProyectoChart from '../components/ValorPorProyectoChart';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null); // Nuevo estado para la gráfica
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pedimos los datos de los KPIs y de la gráfica al mismo tiempo
        const [statsRes, chartRes] = await Promise.all([
          getDashboardStats(),
          getValorPorProyectoChartData()
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data);
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard.');
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {error && <p className="text-red-500">{error}</p>}

      {!stats && !error && <p>Cargando estadísticas...</p>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard
            title="Proyectos Activos"
            value={stats.proyectos_activos}
          />
          <KpiCard
            title="Clientes Totales"
            value={stats.clientes_totales}
          />
          <KpiCard
            title="Valor Total en Contratos (MXN Aprox.)"
            value={stats.valor_total_contratos_mxn}
            formatAsCurrency={true} // Le decimos a este que formatee el número como moneda
          />
        </div>
      )}

      {/* --- AQUÍ RENDERIZAMOS LA GRÁFICA --- */}
      <div className="mt-12">
        <div className="bg-white p-6 rounded-xl shadow-lg h-96">
          {chartData ? <ValorPorProyectoChart chartData={chartData} /> : <p>Cargando gráfica...</p>}
        </div>
      </div>
    </div>
  );
}