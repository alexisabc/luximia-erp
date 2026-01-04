'use client';
import React, { useState } from 'react';

const FiscalDashboard = () => {
    const [mes, setMes] = useState(1);
    const [anio, setAnio] = useState(2026);
    const [loading, setLoading] = useState(false);

    const handleDownload = () => {
        setLoading(true);
        // Simulate API delay
        setTimeout(() => {
            const mockTxt = "04|85|AAA010101AAA||||1000|||||||||||||\n04|85|BBB020202BBB||||5000|||||||||||||";
            const blob = new Blob([mockTxt], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DIOT_${anio}_${mes}.txt`;
            a.click();
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Reportes Fiscales (SAT)</h1>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📄 Declaración Informativa (DIOT)
                </h2>
                <p className="text-gray-500 mb-6">
                    Genera el archivo batch (TXT) para la carga masiva de operaciones con terceros.
                    El sistema calcula automáticamente la proporción de IVA efectivamente pagado basado en los egresos bancarios.
                </p>

                <div className="flex gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Mes</label>
                        <select
                            value={mes}
                            onChange={e => setMes(e.target.value)}
                            className="border p-2 rounded w-32"
                        >
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            {/* ... */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Año</label>
                        <input
                            type="number"
                            value={anio}
                            onChange={e => setAnio(e.target.value)}
                            className="border p-2 rounded w-24"
                        />
                    </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-sm text-yellow-800">
                    <strong>Nota:</strong> Solo se incluirán pagos con estatus "PAGADO" y que tengan un RFC válido asociado.
                </div>

                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition flex justify-center items-center gap-2"
                >
                    {loading ? 'Generando...' : 'Descargar TXT para SAT'}
                </button>
            </div>
        </div>
    );
};

export default FiscalDashboard;
