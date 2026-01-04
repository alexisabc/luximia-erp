'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CurrencyDollarIcon,
    ChartBarIcon,
    TrendingUpIcon,
    BanknotesIcon,
    BuildingOfficeIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

import KPICard from '../../../components/reports/KPICard';

export default function ReportesEjecutivoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [kpis, setKPIs] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/core/reportes/kpis/');
            const data = await response.json();
            setKPIs(data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Vista consolidada de indicadores clave del negocio
                    </p>
                </div>

                {/* KPIs Grid */}
                {kpis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <KPICard
                            title="Facturación Mes Actual"
                            value={`$${kpis.facturacion_mes_actual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            trend={kpis.crecimiento_mensual.toString()}
                            icon={CurrencyDollarIcon}
                            color="blue"
                        />
                        <KPICard
                            title="Facturación Mes Anterior"
                            value={`$${kpis.facturacion_mes_anterior.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            icon={ChartBarIcon}
                            color="purple"
                        />
                        <KPICard
                            title="Crecimiento Mensual"
                            value={`${kpis.crecimiento_mensual.toFixed(1)}%`}
                            icon={TrendingUpIcon}
                            color={kpis.crecimiento_mensual >= 0 ? 'green' : 'red'}
                        />
                        <KPICard
                            title="Liquidez Total"
                            value={`$${kpis.liquidez.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            icon={BanknotesIcon}
                            color="green"
                        />
                        <KPICard
                            title="Obras Activas"
                            value={kpis.obras_activas}
                            icon={BuildingOfficeIcon}
                            color="blue"
                        />
                        <KPICard
                            title="Obras en Riesgo"
                            value={kpis.obras_en_riesgo}
                            icon={UserGroupIcon}
                            color="yellow"
                        />
                    </div>
                )}

                {/* Quick Access */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => router.push('/reportes/financiero')}
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                    >
                        <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte Financiero</h3>
                        <p className="text-sm text-gray-500">
                            Análisis detallado de ingresos, egresos y utilidades
                        </p>
                    </button>

                    <button
                        onClick={() => router.push('/reportes/ventas')}
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                    >
                        <ChartBarIcon className="h-8 w-8 text-green-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Ventas</h3>
                        <p className="text-sm text-gray-500">
                            Top clientes y análisis de facturación
                        </p>
                    </button>

                    <button
                        onClick={() => router.push('/reportes/obras')}
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                    >
                        <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporte de Obras</h3>
                        <p className="text-sm text-gray-500">
                            Rentabilidad y estado de proyectos
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
