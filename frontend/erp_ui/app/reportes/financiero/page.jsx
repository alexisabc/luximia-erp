'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CurrencyDollarIcon,
    ChartBarIcon,
    TrendingUpIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

import FinancialLineChart from '../../../components/charts/LineChart';
import KPICard from '../../../components/reports/KPICard';

export default function ReportesFinancieroPage() {
    const [loading, setLoading] = useState(true);
    const [resumen, setResumen] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [kpis, setKPIs] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchData();
    }, [fechaInicio, fechaFin]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch resumen financiero
            const resumenRes = await fetch(
                `/api/core/reportes/financiero/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
            );
            const resumenData = await resumenRes.json();
            setResumen(resumenData);

            // Fetch ventas por período
            const ventasRes = await fetch(
                `/api/core/reportes/ventas/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&periodo=mes`
            );
            const ventasData = await ventasRes.json();
            setVentas(ventasData);

            // Fetch KPIs
            const kpisRes = await fetch(`/api/core/reportes/kpis/`);
            const kpisData = await kpisRes.json();
            setKPIs(kpisData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodoChange = (meses) => {
        const hoy = new Date();
        const inicio = startOfMonth(subMonths(hoy, meses));
        setFechaInicio(format(inicio, 'yyyy-MM-dd'));
        setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Cargando reportes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Financiero</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Análisis financiero y métricas clave del negocio
                    </p>
                </div>

                {/* Period Selector */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="text-sm font-medium text-gray-700">Período:</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePeriodoChange(0)}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Este Mes
                            </button>
                            <button
                                onClick={() => handlePeriodoChange(3)}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Últimos 3 Meses
                            </button>
                            <button
                                onClick={() => handlePeriodoChange(6)}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Últimos 6 Meses
                            </button>
                            <button
                                onClick={() => handlePeriodoChange(12)}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Último Año
                            </button>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* KPIs Grid */}
                {kpis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <KPICard
                            title="Facturación Mes Actual"
                            value={`$${kpis.facturacion_mes_actual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            trend={kpis.crecimiento_mensual.toString()}
                            icon={CurrencyDollarIcon}
                            color="blue"
                        />
                        <KPICard
                            title="Obras Activas"
                            value={kpis.obras_activas}
                            icon={ChartBarIcon}
                            color="green"
                        />
                        <KPICard
                            title="Liquidez"
                            value={`$${kpis.liquidez.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            icon={BanknotesIcon}
                            color="purple"
                        />
                        <KPICard
                            title="Crecimiento"
                            value={`${kpis.crecimiento_mensual.toFixed(1)}%`}
                            icon={TrendingUpIcon}
                            color={kpis.crecimiento_mensual >= 0 ? 'green' : 'red'}
                        />
                    </div>
                )}

                {/* Resumen Financiero */}
                {resumen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">Ingresos</h3>
                            <p className="text-2xl font-bold text-green-600">
                                ${resumen.ingresos_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{resumen.facturas_count} facturas</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">Egresos</h3>
                            <p className="text-2xl font-bold text-red-600">
                                ${resumen.egresos_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{resumen.egresos_count} egresos</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">Utilidad</h3>
                            <p className={`text-2xl font-bold ${resumen.utilidad >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ${resumen.utilidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Margen: {resumen.margen.toFixed(1)}%</p>
                        </div>
                    </div>
                )}

                {/* Gráfica de Ventas */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ventas</h2>
                    <FinancialLineChart
                        data={ventas}
                        xKey="periodo"
                        yKeys={['total']}
                        colors={['#3b82f6']}
                    />
                </div>
            </div>
        </div>
    );
}
