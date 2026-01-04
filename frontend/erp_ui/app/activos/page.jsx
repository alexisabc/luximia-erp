'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const ActivosDashboard = () => {
    const router = useRouter();

    // Mock Statistics
    const kpis = [
        { title: "Valor Total Activos", value: "$12,450,000", change: "+2.5%" },
        { title: "Total Unidades", value: "34", change: "+1" },
        { title: "En Obra", value: "28", change: "82%" },
        { title: "En Mantenimiento", value: "3", change: "8%", alert: true },
    ];

    const [recentAssets, setRecentAssets] = useState([
        { id: 1, codigo: 'MAQ-001', nombre: 'Excavadora CAT 320', ubicacion: 'Torre A', estado: 'EN_USO' },
        { id: 2, codigo: 'VEH-005', nombre: 'Nissan NP300', ubicacion: 'Oficina Central', estado: 'DISPONIBLE' },
        { id: 3, codigo: 'MAQ-004', nombre: 'Retroexcavadora JCB', ubicacion: 'Taller', estado: 'MANTENIMIENTO' },
    ]);

    return (
        <div className="p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Activos Fijos</h1>
                    <p className="text-gray-500">Control de Maquinaria, Vehículos y Equipo</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push('/activos/inventario')}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 shadow"
                    >
                        Ver Inventario Completo
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">{kpi.title}</p>
                        <h3 className={`text-2xl font-bold mt-1 ${kpi.alert ? 'text-red-600' : 'text-gray-800'}`}>
                            {kpi.value}
                        </h3>
                        <p className="text-xs text-blue-600 mt-2">{kpi.change} vs mes anterior</p>
                    </div>
                ))}
            </div>

            {/* Recent Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-lg mb-4">Activos Recientes</h3>
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                            <th className="pb-3">Código</th>
                            <th className="pb-3">Activo</th>
                            <th className="pb-3">Ubicación Actual</th>
                            <th className="pb-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentAssets.map(asset => (
                            <tr key={asset.id} className="border-b last:border-0">
                                <td className="py-4 font-mono text-sm">{asset.codigo}</td>
                                <td className="py-4 font-medium">{asset.nombre}</td>
                                <td className="py-4 text-sm text-gray-600">{asset.ubicacion}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${asset.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-700' :
                                            asset.estado === 'MANTENIMIENTO' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {asset.estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActivosDashboard;
