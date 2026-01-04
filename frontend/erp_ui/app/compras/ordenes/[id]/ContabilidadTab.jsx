'use client';
import React from 'react';

// This would be imported into the main ODC details page
const ContabilidadTab = ({ polizas }) => {
    if (!polizas || polizas.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded-lg">
                No hay pólizas contables generadas para este documento.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {polizas.map(poliza => (
                <div key={poliza.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <div>
                            <span className="font-bold text-gray-800 mr-2">{poliza.tipo} {poliza.numero}</span>
                            <span className="text-sm text-gray-500">{poliza.fecha}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${poliza.cuadrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {poliza.cuadrada ? 'Cuadrada' : 'Descuadrada'}
                        </span>
                    </div>
                    <div className="p-4">
                        <h4 className="text-sm font-semibold mb-2">{poliza.concepto}</h4>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-2">Cuenta</th>
                                    <th className="pb-2">Nombre</th>
                                    <th className="pb-2 text-right">Debe</th>
                                    <th className="pb-2 text-right">Haber</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {poliza.detalles.map((det, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2 text-gray-600">{det.cuenta_codigo}</td>
                                        <td className="py-2 font-medium">{det.cuenta_nombre}</td>
                                        <td className="py-2 text-right text-gray-700 font-mono">
                                            {det.debe > 0 ? `$${det.debe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="py-2 text-right text-gray-700 font-mono">
                                            {det.haber > 0 ? `$${det.haber.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold border-t bg-gray-50/50">
                                    <td colSpan="2" className="py-2 text-right pr-4">Totales:</td>
                                    <td className="py-2 text-right text-green-700">${poliza.total_debe.toLocaleString('es-MX')}</td>
                                    <td className="py-2 text-right text-green-700">${poliza.total_haber.toLocaleString('es-MX')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ContabilidadTab;
