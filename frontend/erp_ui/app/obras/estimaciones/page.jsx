'use client';
import React, { useState } from 'react';

const EstimacionesPage = () => {
    // Mock Data
    const [estimaciones, setEstimaciones] = useState([
        { id: 1, folio: 'OBR01-EST-001', fecha: '2026-01-15', avance: 100000, amort: 30000, garantia: 5000, total: 75400, estado: 'AUTORIZADA' },
        { id: 2, folio: 'OBR01-EST-002', fecha: '2026-01-30', avance: 150000, amort: 45000, garantia: 7500, total: 113100, estado: 'BORRADOR' },
    ]);

    const handleCreate = () => {
        const nuevoAvance = prompt("Ingrese Monto de Avance:");
        if (nuevoAvance) {
            // Mock Calculation
            const avance = parseFloat(nuevoAvance);
            const amort = avance * 0.30;
            const garantia = avance * 0.05;
            const sub = avance - amort - garantia;
            const total = sub * 1.16;

            const nueva = {
                id: Date.now(),
                folio: `OBR01-EST-00${estimaciones.length + 1}`,
                fecha: new Date().toISOString().split('T')[0],
                avance, amort, garantia, total,
                estado: 'BORRADOR'
            };
            setEstimaciones([...estimaciones, nueva]);
        }
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Estimaciones de Obra</h1>
                <button
                    onClick={handleCreate}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                    + Nueva Estimación
                </button>
            </header>

            <div className="grid gap-4">
                {estimaciones.map(est => (
                    <div key={est.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg">{est.folio}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${est.estado === 'AUTORIZADA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {est.estado}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Fecha Corte: {est.fecha}</p>
                        </div>

                        <div className="flex gap-8 text-right text-sm">
                            <div>
                                <p className="text-gray-500">Avance Bruto</p>
                                <p className="font-mono font-medium">${est.avance.toLocaleString('es-MX')}</p>
                            </div>
                            <div>
                                <p className="text-red-400">Amortización (30%)</p>
                                <p className="font-mono text-red-600">-${est.amort.toLocaleString('es-MX')}</p>
                            </div>
                            <div>
                                <p className="text-red-400">Garantía (5%)</p>
                                <p className="font-mono text-red-600">-${est.garantia.toLocaleString('es-MX')}</p>
                            </div>
                            <div className="border-l pl-8">
                                <p className="text-gray-500">Neto a Cobrar</p>
                                <p className="font-bold text-lg text-green-700">${est.total.toLocaleString('es-MX')}</p>
                            </div>
                            {est.estado === 'AUTORIZADA' && (
                                <div className="ml-4">
                                    <button
                                        onClick={() => alert("Generando Factura para " + est.folio)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg transition"
                                    >
                                        Facturar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EstimacionesPage;
