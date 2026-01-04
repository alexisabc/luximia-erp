'use client';

import { useState, useEffect } from 'react';
import {
    BuildingOfficeIcon,
    ChartBarIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import KPICard from '../../../components/reports/KPICard';

export default function ReportesObrasPage() {
    const [loading, setLoading] = useState(true);
    const [obras, setObras] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/core/reportes/obras/');
            const data = await response.json();
            setObras(data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const obrasActivas = obras.filter(o => o.estado === 'ACTIVA').length;
    const obrasEnRiesgo = obras.filter(o => o.margen < 10).length;
    const margenPromedio = obras.length > 0
        ? obras.reduce((sum, o) => sum + o.margen, 0) / obras.length
        : 0;

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
                    <h1 className="text-3xl font-bold text-gray-900">Reportes de Obras</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Análisis de rentabilidad y estado de proyectos
                    </p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <KPICard
                        title="Obras Activas"
                        value={obrasActivas}
                        icon={BuildingOfficeIcon}
                        color="blue"
                    />
                    <KPICard
                        title="Obras en Riesgo"
                        value={obrasEnRiesgo}
                        icon={ExclamationTriangleIcon}
                        color="red"
                    />
                    <KPICard
                        title="Margen Promedio"
                        value={`${margenPromedio.toFixed(1)}%`}
                        icon={ChartBarIcon}
                        color="green"
                    />
                </div>

                {/* Tabla de Obras */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Rentabilidad por Obra</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Real</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilidad</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {obras.map((obra) => (
                                    <tr key={obra.obra_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{obra.obra_nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${obra.estado === 'ACTIVA' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {obra.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            ${obra.presupuesto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            ${obra.costo_real.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${obra.utilidad >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            ${obra.utilidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${obra.margen >= 20 ? 'text-green-600' :
                                                obra.margen >= 10 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {obra.margen.toFixed(1)}%
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
