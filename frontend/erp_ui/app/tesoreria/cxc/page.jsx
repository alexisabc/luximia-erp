'use client';
import React, { useState } from 'react';

// Mock Data
const PENDING_ESTIMATES = [
    { id: 1, folio: 'OBR01-EST-001', cliente: 'Grupo Hotelero SA', fecha: '2026-01-15', total: 75400.00, saldo: 75400.00 },
    { id: 2, folio: 'OBR02-EST-005', cliente: 'Inmobiliaria Sur', fecha: '2026-01-10', total: 120000.00, saldo: 50000.00 },
];

const CuentasPorCobrarPage = () => {
    const [selectedEst, setSelectedEst] = useState(null);
    const [montoPagar, setMontoPagar] = useState('');

    const handleCobrar = () => {
        alert(`Registrando cobro de $${montoPagar} para ${selectedEst.folio}`);
        // Call API
        setSelectedEst(null);
        setMontoPagar('');
    };

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Cuentas por Cobrar</h1>
                <p className="text-gray-500">Gestión de ingresos por Estimaciones de Obra</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                    <p className="text-sm text-green-600 font-medium">Por Cobrar (Total)</p>
                    <p className="text-2xl font-bold text-green-800">$125,400.00</p>
                </div>
                {/* More widgets... */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">Folio Est.</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Fecha Emisión</th>
                            <th className="p-4 text-right">Total Facturado</th>
                            <th className="p-4 text-right">Saldo Pendiente</th>
                            <th className="p-4 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {PENDING_ESTIMATES.map(est => (
                            <tr key={est.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-medium">{est.folio}</td>
                                <td className="p-4">{est.cliente}</td>
                                <td className="p-4 text-gray-500">{est.fecha}</td>
                                <td className="p-4 text-right text-gray-500">${est.total.toLocaleString('es-MX')}</td>
                                <td className="p-4 text-right font-bold text-gray-800">${est.saldo.toLocaleString('es-MX')}</td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => { setSelectedEst(est); setMontoPagar(est.saldo); }}
                                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-xs transition"
                                    >
                                        Registrar Pago
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Cobro */}
            {selectedEst && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold mb-4">Registrar Cobro</h2>
                        <div className="mb-4 text-sm">
                            <p><strong>Estimación:</strong> {selectedEst.folio}</p>
                            <p><strong>Saldo Actual:</strong> ${selectedEst.saldo.toLocaleString('es-MX')}</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Monto Recibido</label>
                                <input
                                    type="number"
                                    value={montoPagar}
                                    onChange={e => setMontoPagar(e.target.value)}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Banco Destino</label>
                                <select className="w-full border rounded-lg p-2">
                                    <option>Cuenta Principal (BBVA)</option>
                                    <option>Cuenta Secundaria (Banamex)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Referencia / SPEI</label>
                                <input type="text" className="w-full border rounded-lg p-2" placeholder="Ej. DEP 10293" />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedEst(null)}
                                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCobrar}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                                Confirmar Ingreso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CuentasPorCobrarPage;
