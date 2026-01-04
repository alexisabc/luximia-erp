'use client';
import React, { useState } from 'react';

const MantenimientoPage = () => {
    const [filter, setFilter] = useState('TODOS');

    // Mock Data
    const [mantenimientos, setMantenimientos] = useState([
        {
            id: 1,
            activo: 'MAQ-001 Excavadora CAT',
            tipo: 'PREVENTIVO',
            estado: 'PROGRAMADO',
            fecha_programada: '2026-01-15',
            descripcion: 'Cambio de aceite y filtros',
            costo_total: 0
        },
        {
            id: 2,
            activo: 'VEH-005 Nissan NP300',
            tipo: 'CORRECTIVO',
            estado: 'COMPLETADO',
            fecha_programada: '2025-12-20',
            fecha_realizacion: '2025-12-22',
            descripcion: 'Reparación de transmisión',
            costo_total: 15000
        },
        {
            id: 3,
            activo: 'MAQ-004 Retroexcavadora',
            tipo: 'EMERGENCIA',
            estado: 'EN_PROCESO',
            fecha_programada: '2026-01-05',
            descripcion: 'Falla hidráulica',
            costo_total: 0
        },
    ]);

    const filtered = mantenimientos.filter(m =>
        filter === 'TODOS' || m.estado === filter
    );

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Mantenimiento</h1>
                    <p className="text-gray-500">Programación y Bitácora de Servicios</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow">
                    + Programar Mantenimiento
                </button>
            </header>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                {['TODOS', 'PROGRAMADO', 'EN_PROCESO', 'COMPLETADO'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-bold ${filter === status ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Maintenance List */}
            <div className="grid gap-4">
                {filtered.map(mant => (
                    <div key={mant.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg">{mant.activo}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${mant.tipo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' :
                                            mant.tipo === 'CORRECTIVO' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {mant.tipo}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${mant.estado === 'COMPLETADO' ? 'bg-green-100 text-green-700' :
                                            mant.estado === 'EN_PROCESO' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {mant.estado}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-2">{mant.descripcion}</p>
                                <div className="flex gap-6 text-sm text-gray-500">
                                    <div>
                                        <span className="font-medium">Programado:</span> {mant.fecha_programada}
                                    </div>
                                    {mant.fecha_realizacion && (
                                        <div>
                                            <span className="font-medium">Realizado:</span> {mant.fecha_realizacion}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                {mant.costo_total > 0 && (
                                    <p className="font-mono font-bold text-lg">${mant.costo_total.toLocaleString('es-MX')}</p>
                                )}
                                {mant.estado === 'PROGRAMADO' && (
                                    <button className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                        Iniciar Servicio
                                    </button>
                                )}
                                {mant.estado === 'EN_PROCESO' && (
                                    <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                        Completar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MantenimientoPage;
