'use client';
import React, { useState } from 'react';

const InventarioPage = () => {
    // Mock Data
    const [activos, setActivos] = useState([
        { id: 1, codigo: 'MAQ-001', nombre: 'Excavadora CAT 320', cat: 'Maquinaria', ubicacion: 'Torre A', estado: 'EN_USO', costo: 2500000 },
        { id: 2, codigo: 'VEH-005', nombre: 'Nissan NP300', cat: 'Vehículos', ubicacion: 'Oficina Central', estado: 'DISPONIBLE', costo: 450000 },
        { id: 3, codigo: 'MAQ-004', nombre: 'Retroexcavadora JCB', cat: 'Maquinaria', ubicacion: 'Taller', estado: 'MANTENIMIENTO', costo: 1800000 },
        { id: 4, codigo: 'EQ-102', nombre: 'Laptop Dell XPS', cat: 'Cómputo', ubicacion: 'Ing. Residente', estado: 'EN_USO', costo: 35000 },
    ]);

    const [filter, setFilter] = useState('TODOS');

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Inventario de Activos</h1>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    + Alta de Activo
                </button>
            </header>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                {['TODOS', 'DISPONIBLE', 'EN_USO', 'MANTENIMIENTO'].map(status => (
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

            <div className="grid gap-4">
                {activos
                    .filter(a => filter === 'TODOS' || a.estado === filter)
                    .map(asset => (
                        <div key={asset.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex items-start gap-4">
                                <div className="bg-gray-100 h-16 w-16 rounded-lg flex items-center justify-center text-gray-400 font-bold">
                                    IMG
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{asset.nombre}</h3>
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{asset.codigo}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{asset.cat} • {asset.ubicacion}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${asset.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-700' :
                                            asset.estado === 'MANTENIMIENTO' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {asset.estado}
                                    </span>
                                </div>
                                <p className="font-mono font-medium">${asset.costo.toLocaleString('es-MX')}</p>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default InventarioPage;
