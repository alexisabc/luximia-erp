'use client';
import React, { useState } from 'react';

const NominaDashboard = () => {
    const [periodo, setPeriodo] = useState({
        id: 1, anio: 2026, numero: 1, tipo: 'QUINCENAL',
        inicio: '2026-01-01', fin: '2026-01-15', activo: true,
        totales: { per: 100000, ded: 20000, neto: 80000 }
    });

    const handleCerrar = () => {
        if (confirm("¿Seguro que deseas cerrar la nómina? Esto generará el pasivo por pagar.")) {
            // Call API
            alert("Nómina Cerrada. Póliza GENERADA. Pasivo en Tesorería CREADO.");
            setPeriodo({ ...periodo, activo: false });
        }
    };

    return (
        <div className="p-8">
            <header className="mb-8 flex justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Nómina Centralizada</h1>
                    <p className="text-gray-500">Gestión de Periodos y Cierre</p>
                </div>
                <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${periodo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {periodo.activo ? 'PERIODO ABIERTO' : 'CERRADO'}
                    </span>
                </div>
            </header>

            {/* Current Period Card */}
            <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <h2 className="text-xl font-bold">{periodo.tipo} {periodo.anio} - Periodo {periodo.numero}</h2>
                    <p className="opacity-80 text-sm mt-1">Del {periodo.inicio} al {periodo.fin}</p>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-x">
                    <div>
                        <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">Total Percepciones</p>
                        <p className="text-2xl font-bold text-gray-800">${periodo.totales.per.toLocaleString('es-MX')}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">Total Deducciones</p>
                        <p className="text-2xl font-bold text-red-600">-${periodo.totales.ded.toLocaleString('es-MX')}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">Neto a Pagar</p>
                        <p className="text-3xl font-bold text-green-600">${periodo.totales.neto.toLocaleString('es-MX')}</p>
                    </div>
                </div>
                {periodo.activo && (
                    <div className="bg-gray-50 p-4 text-right border-t">
                        <button
                            onClick={handleCerrar}
                            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 shadow-lg transition transform hover:scale-105"
                        >
                            Cerrar y Contabilizar
                        </button>
                    </div>
                )}
                {!periodo.activo && (
                    <div className="bg-gray-50 p-4 text-right border-t border-gray-200">
                        <div className="flex justify-end items-center gap-4">
                            <span className="text-gray-500 text-sm">Timbrado Pendiente</span>
                            <button
                                onClick={() => alert("Simulando Timbrado... UUIDs generados.")}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 shadow-lg"
                            >
                                Timbrar Nómina Ante el SAT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Integration Status Mock */}
            {!periodo.activo && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <h3 className="font-bold text-green-800 flex items-center gap-2">
                            ✓ Contabilidad
                        </h3>
                        <p className="text-sm text-green-700 mt-1">Póliza PROVISION_NOMINA generada exitosamente.</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2">
                            ✓ Tesorería
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">ContraRecibo Global creado. Listo para programación de pago.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NominaDashboard;
