'use client';
import React, { useState } from 'react';

const CronogramaPage = ({ params }) => {
    const obraId = params.id;

    // Mock Data - Simplified Gantt
    const [actividades, setActividades] = useState([
        { id: 1, codigo: 'A', nombre: 'Preliminares', inicio: 0, duracion: 5, es_critica: false, avance: 100 },
        { id: 2, codigo: 'B', nombre: 'Cimentación', inicio: 5, duracion: 10, es_critica: true, avance: 80 },
        { id: 3, codigo: 'C', nombre: 'Estructura', inicio: 15, duracion: 20, es_critica: true, avance: 40 },
        { id: 4, codigo: 'D', nombre: 'Instalaciones', inicio: 15, duracion: 15, es_critica: false, avance: 20 },
        { id: 5, codigo: 'E', nombre: 'Acabados', inicio: 35, duracion: 10, es_critica: true, avance: 0 },
    ]);

    const duracionTotal = Math.max(...actividades.map(a => a.inicio + a.duracion));
    const pixelsPorDia = 8; // Escala visual

    return (
        <div className="p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Cronograma de Proyecto</h1>
                    <p className="text-gray-500">Diagrama de Gantt y Ruta Crítica</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Calcular Ruta Crítica
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        + Nueva Actividad
                    </button>
                </div>
            </header>

            {/* Legend */}
            <div className="mb-6 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Ruta Crítica</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Actividad Normal</span>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 overflow-x-auto">
                <div className="min-w-max">
                    {/* Timeline Header */}
                    <div className="flex mb-4">
                        <div className="w-64 font-bold text-sm">Actividad</div>
                        <div className="flex-1 flex border-l border-gray-200">
                            {Array.from({ length: Math.ceil(duracionTotal / 5) }).map((_, i) => (
                                <div key={i} className="flex-1 text-center text-xs text-gray-500 border-r border-gray-100">
                                    Día {i * 5}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activities */}
                    {actividades.map(act => (
                        <div key={act.id} className="flex items-center mb-3">
                            <div className="w-64">
                                <div className="font-medium">{act.codigo} - {act.nombre}</div>
                                <div className="text-xs text-gray-500">{act.duracion} días • {act.avance}%</div>
                            </div>
                            <div className="flex-1 relative h-10 border-l border-gray-200">
                                {/* Grid Lines */}
                                {Array.from({ length: Math.ceil(duracionTotal / 5) }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute h-full border-r border-gray-100"
                                        style={{ left: `${(i * 5 * pixelsPorDia / duracionTotal) * 100}%` }}
                                    ></div>
                                ))}

                                {/* Activity Bar */}
                                <div
                                    className={`absolute h-8 rounded flex items-center justify-center text-white text-xs font-bold ${act.es_critica ? 'bg-red-500' : 'bg-blue-500'
                                        }`}
                                    style={{
                                        left: `${(act.inicio / duracionTotal) * 100}%`,
                                        width: `${(act.duracion / duracionTotal) * 100}%`,
                                        top: '4px'
                                    }}
                                >
                                    {act.avance}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Table */}
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-lg mb-4">Detalle de Actividades</h3>
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                            <th className="pb-3">Código</th>
                            <th className="pb-3">Actividad</th>
                            <th className="pb-3">Duración</th>
                            <th className="pb-3">Inicio</th>
                            <th className="pb-3">Fin</th>
                            <th className="pb-3">Avance</th>
                            <th className="pb-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actividades.map(act => (
                            <tr key={act.id} className="border-b last:border-0">
                                <td className="py-4 font-mono text-sm">{act.codigo}</td>
                                <td className="py-4 font-medium">{act.nombre}</td>
                                <td className="py-4">{act.duracion}d</td>
                                <td className="py-4 text-sm">Día {act.inicio}</td>
                                <td className="py-4 text-sm">Día {act.inicio + act.duracion}</td>
                                <td className="py-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{ width: `${act.avance}%` }}
                                        ></div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    {act.es_critica && (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                            CRÍTICA
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CronogramaPage;
