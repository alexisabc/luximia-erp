// app/dashboard/page.jsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStrategicDashboardData, getAllProyectos } from '@/services/api';

// Componentes de UI
import Overlay from '@/components/loaders/Overlay';
import { KpiCard } from '@/components/molecules';
import VentasChart from '@/components/charts/Ventas';
import FlujoCobranzaChart from '@/components/charts/FlujoCobranza';

export default function DashboardPage() {
    const [dashboardData, setDashboardData] = useState(null);
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(true);

    // Estados de los filtros
    // Por defecto a 'year' para asegurar datos visibles inicialmente
    const [timeframe, setTimeframe] = useState('year');
    const [selectedProjects, setSelectedProjects] = useState('all');

    // --- 1. Lógica para obtener los datos ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashboardRes, proyectosRes] = await Promise.all([
                getStrategicDashboardData(timeframe, selectedProjects.toString()),
                getAllProyectos(),
            ]);

            const dashboard = dashboardRes.data ?? {};
            const labels = dashboard.chart?.labels;
            if (!labels || labels.length === 0) {
                setHasData(false);
                console.warn('Dashboard response missing chart labels', dashboard);
            } else {
                setHasData(true);
            }

            setDashboardData(dashboard);
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

        // Combinar en objetos para ordenar
        const combined = labels.map((label, i) => ({
            label,
            Ventas: Number(ventas[i] ?? 0),
            // Añadimos una fecha para ordenar correctamente
            dateObj: new Date(label)
        }));

        // Ordenar por fecha
        combined.sort((a, b) => a.dateObj - b.dateObj);

        return combined.map(({ label, Ventas }) => ({ label, Ventas }));
    }, [dashboardData]);

    const flujoChartData = useMemo(() => {
        const labels = dashboardData?.chart?.labels ?? [];
        const recuperado = dashboardData?.chart?.recuperado ?? [];
        const programado = dashboardData?.chart?.programado ?? [];

        const combined = labels.map((label, i) => ({
            label,
            Cobrado: Number(recuperado[i] ?? 0),
            'Por Cobrar': Number(programado[i] ?? 0),
            dateObj: new Date(label)
        }));

        combined.sort((a, b) => a.dateObj - b.dateObj);

        return combined.map(({ label, Cobrado, 'Por Cobrar': PorCobrar }) => ({ label, Cobrado, 'Por Cobrar': PorCobrar }));
    }, [dashboardData]);


    if (loading && !dashboardData) {
        return <Overlay show />;
    }

    return (

        <div className="relative p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen">
            {/* --- Overlay de Carga --- */}
            <Overlay show={loading} />

            {/* --- Encabezado y Filtros --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Dashboard Estratégico
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        Resumen financiero y operativo en tiempo real.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Filtro de periodo */}
                    <div className="relative group">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-40 cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800"
                        >
                            <option value="month">Este Mes</option>
                            <option value="week">Esta Semana</option>
                            <option value="year">Este Año</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Filtro de proyecto */}
                    <div className="relative group flex-grow md:flex-grow-0">
                        <select
                            value={selectedProjects}
                            onChange={(e) => setSelectedProjects(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-64 cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800"
                        >
                            <option value="all">Todos los Proyectos</option>
                            {proyectos.map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KPIs --- */}
            {dashboardData?.kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <KpiCard title="Total UPEs" value={dashboardData.kpis.upes_total} />
                    <KpiCard title="Total en Ventas" value={dashboardData.kpis.ventas} />
                    <KpiCard title="Total Recuperado" value={dashboardData.kpis.recuperado} />
                    <KpiCard title="Monto por Cobrar" value={dashboardData.kpis.por_cobrar} />
                    <KpiCard title="Monto en Morosidad" value={dashboardData.kpis.vencido} />
                </div>
            )}

            {/* --- Gráficas --- */}
            {hasData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    <VentasChart data={ventasChartData} />
                    <FlujoCobranzaChart data={flujoChartData} />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Sin datos disponibles</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mt-2">No se encontraron registros para el periodo o proyecto seleccionado. Intenta ajustar los filtros.</p>
                </div>
            )}
        </div>
    );
}
