'use client';
import React, { useState } from 'react';

// Mock Data
const MOCK_INVOICES = [
    { id: 101, folio: 'CR-2026-00101', proveedor: 'Concretos del Norte SA', fecha: '2026-01-05', monto: 15400.00, estado: 'VALIDADO' },
    { id: 102, folio: 'CR-2026-00102', proveedor: 'Aceros Industriales', fecha: '2026-01-03', monto: 8500.50, estado: 'VALIDADO' },
    { id: 103, folio: 'CR-2026-00103', proveedor: 'Papelería Office', fecha: '2026-01-10', monto: 1200.00, estado: 'PROGRAMADO' },
];

const CuentasPorPagarPage = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleGenerarLote = () => {
        alert(`Generando Lote para ${selectedIds.length} facturas.\nTotal: $${calculateTotal()}`);
        // Call API
    };

    const calculateTotal = () => {
        return MOCK_INVOICES
            .filter(inv => selectedIds.includes(inv.id))
            .reduce((sum, inv) => sum + inv.monto, 0)
            .toLocaleString('es-MX');
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cuentas por Pagar</h1>
                    <p className="text-gray-500">Gestión de obligaciones y programación de pagos</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        Descargar Reporte
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleGenerarLote}
                            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 shadow-lg animate-in fade-in"
                        >
                            Programar Pago ({selectedIds.length})
                        </button>
                    )}
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4 w-10">
                                <input type="checkbox" className="rounded border-gray-300" />
                            </th>
                            <th className="p-4">Folio CR</th>
                            <th className="p-4">Proveedor</th>
                            <th className="p-4">Fecha Vencimiento</th>
                            <th className="p-4 text-right">Monto</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {MOCK_INVOICES.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(inv.id)}
                                        onChange={() => toggleSelection(inv.id)}
                                        className="rounded border-gray-300 cursor-pointer"
                                        disabled={inv.estado !== 'VALIDADO'}
                                    />
                                </td>
                                <td className="p-4 font-medium text-gray-900">{inv.folio}</td>
                                <td className="p-4 text-gray-600">{inv.proveedor}</td>
                                <td className="p-4 text-gray-500">{inv.fecha}</td>
                                <td className="p-4 text-right font-mono">${inv.monto.toLocaleString('es-MX')}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs border ${inv.estado === 'VALIDADO' ? 'bg-green-50 text-green-700 border-green-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {inv.estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-right text-xs text-gray-500">
                    Mostrando {MOCK_INVOICES.length} registros
                </div>
            </div>
        </div>
    );
};

export default CuentasPorPagarPage;
