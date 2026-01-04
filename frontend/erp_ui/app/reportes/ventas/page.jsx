'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { UserGroupIcon, ChartPieIcon } from '@heroicons/react/24/outline';

import FinancialBarChart from '../../../components/charts/BarChart';
import KPICard from '../../../components/reports/KPICard';

export default function ReportesVentasPage() {
    const [loading, setLoading] = useState(true);
    const [topClientes, setTopClientes] = useState([]);
    const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchData();
    }, [fechaInicio, fechaFin]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `/api/core/reportes/top-clientes/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limit=10`
            );
            const data = await response.json();
            setTopClientes(data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = topClientes.map(c => ({
        name: c.cliente_nombre.substring(0, 20),
        value: c.total_facturado
    }));

    const totalFacturado = topClientes.reduce((sum, c) => sum + c.total_facturado, 0);
    const totalFacturas = topClientes.reduce((sum, c) => sum + c.num_facturas, 0);

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Reportes de Ventas</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Análisis de clientes y facturación
                    </p>
                </div>

                {/* Period Selector */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Período:</label>
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

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <KPICard
                        title="Total Facturado"
                        value={`$${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={ChartPieIcon}
                        color="blue"
                    />
                    <KPICard
                        title="Total Facturas"
                        value={totalFacturas}
                        icon={UserGroupIcon}
                        color="green"
                    />
                    <KPICard
                        title="Clientes Top 10"
                        value={topClientes.length}
                        icon={UserGroupIcon}
                        color="purple"
                    />
                </div>

                {/* Top Clientes Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Clientes</h2>
                    <FinancialBarChart
                        data={chartData}
                        xKey="name"
                        yKey="value"
                        color="#3b82f6"
                    />
                </div>

                {/* Tabla de Clientes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Clientes</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFC</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Facturas</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topClientes.map((cliente, index) => (
                                    <tr key={cliente.cliente_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cliente.cliente_nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{cliente.cliente_rfc}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{cliente.num_facturas}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                            ${cliente.total_facturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
