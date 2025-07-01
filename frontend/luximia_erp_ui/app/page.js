// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
// ### CAMBIO: Importamos la nueva función y el nuevo componente
import { getDashboardStats, getValorPorProyectoChartData, getUpeStatusChartData } from '../services/api';
import KpiCard from '../components/KpiCard';
import ValorPorProyectoChart from '../components/ValorPorProyectoChart';
import UpeStatusChart from '../components/UpeStatusChart'; // <-- NUEVO
import ChatInteligente from '../components/ChatInteligente';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [valorProyectoData, setValorProyectoData] = useState(null);
  const [upeStatusData, setUpeStatusData] = useState(null); // <-- NUEVO ESTADO
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ### CAMBIO: Pedimos los datos de las 3 cosas al mismo tiempo
        const [statsRes, valorProyectoRes, upeStatusRes] = await Promise.all([
          getDashboardStats(),
          getValorPorProyectoChartData(),
          getUpeStatusChartData() // <-- NUEVA LLAMADA
        ]);
        setStats(statsRes.data);
        setValorProyectoData(valorProyectoRes.data);
        setUpeStatusData(upeStatusRes.data); // <-- GUARDAMOS LOS DATOS
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* <-- CAMBIADO A 4 COLUMNAS */}
          <KpiCard
            title="Proyectos Activos"
            value={stats.proyectos_activos}
          />
          <KpiCard
            title="Clientes Totales"
            value={stats.clientes_totales}
          />
          {/* ### NUEVA TARJETA ### */}
          <KpiCard
            title="UPEs Totales"
            value={stats.upes_totales}
          />
          <KpiCard
            title="Valor Total en Contratos (MXN Aprox.)"
            value={stats.valor_total_contratos_mxn}
            formatAsCurrency={true}
          />
        </div>
      )}

      {/* ### CAMBIO: Ajustamos la rejilla para mostrar ambas gráficas ### */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mt-12">
        {/* Gráfica de Barras (ocupa 3 columnas) */}
        <div className="xl:col-span-3 bg-white p-6 rounded-xl shadow-lg h-96">
          {valorProyectoData ? <ValorPorProyectoChart chartData={valorProyectoData} /> : <p>Cargando gráfica...</p>}
        </div>
        {/* Gráfica de Dona (ocupa 2 columnas) */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-lg h-96">
          {upeStatusData ? <UpeStatusChart chartData={upeStatusData} /> : <p>Cargando gráfica...</p>}
        </div>
      </div>

      <ChatInteligente />
    </div>
  );
}