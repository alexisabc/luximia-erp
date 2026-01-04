'use client';
import React from 'react';

const DashboardPage = () => {
    // Mock Data (In production, fetch from DashboardService)
    const data = {
        kpis: {
            bancos: 1500000,
            cxc: 450000,
            cxp: 320000,
            flujo_neto: 1630000
        },
        obras: [
            { id: 1, nombre: 'Torre Reforma', ingresos: 5000000, egresos: 3500000, margen: 1500000, pct: 30.0 },
            { id: 2, nombre: 'Carretera Norte', ingresos: 1200000, egresos: 1300000, margen: -100000, pct: -8.3 },
        ],
        alertas: [
            { nivel: 'CRITICO', mensaje: 'Proyecto "Carretera Norte" con margen negativo.' },
            { nivel: 'WARNING', mensaje: '3 Facturas de Proveedores vencen hoy.' }
        ]
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Resumen Ejecutivo</h1>
                <p className="text-gray-500">Visión global financiera y operativa</p>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <KpiCard title="Saldo en Bancos" amount={data.kpis.bancos} color="blue" />
                <KpiCard title="Cuentas por Cobrar" amount={data.kpis.cxc} color="green" />
                <KpiCard title="Cuentas por Pagar" amount={data.kpis.cxp} color="red" />
                <KpiCard title="Capital de Trabajo" amount={data.kpis.flujo_neto} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Project Profitability */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Rentabilidad por Proyecto</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="pb-3 pl-2">Proyecto</th>
                                <th className="pb-3 text-right">Ingresos (Est)</th>
                                <th className="pb-3 text-right">Costos (ODC)</th>
                                <th className="pb-3 text-right">Margen</th>
                                <th className="pb-3 text-right pr-2">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.obras.map(obra => (
                                <tr key={obra.id} className="hover:bg-gray-50">
                                    <td className="py-3 pl-2 font-medium">{obra.nombre}</td>
                                    <td className="py-3 text-right text-green-700">${obra.ingresos.toLocaleString('es-MX')}</td>
                                    <td className="py-3 text-right text-red-600">${obra.egresos.toLocaleString('es-MX')}</td>
                                    <td className={`py-3 text-right font-bold ${obra.margen >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                        ${obra.margen.toLocaleString('es-MX')}
                                    </td>
                                    <td className="py-3 text-right pr-2">
                                        <span className={`px-2 py-1 rounded text-xs ${obra.pct >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {obra.pct}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sidebar: Alerts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Centro de Alertas</h2>
                    <div className="space-y-4">
                        {data.alertas.map((alerta, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border-l-4 ${alerta.nivel === 'CRITICO' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                                <p className={`text-xs font-bold ${alerta.nivel === 'CRITICO' ? 'text-red-700' : 'text-yellow-700'}`}>{alerta.nivel}</p>
                                <p className="text-sm text-gray-800 mt-1">{alerta.mensaje}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, amount, color }) => {
    const colorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        red: 'text-red-600',
        indigo: 'text-indigo-600'
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${colorClasses[color]}`}>
                ${amount.toLocaleString('es-MX')}
            </p>
        </div>
    );
};

export default DashboardPage;
