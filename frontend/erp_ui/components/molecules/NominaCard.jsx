import React from 'react';
import { StatusBadge } from '../atoms/StatusBadge';
import { Calculator, Lock, Eye, FileText } from 'lucide-react';

export const NominaCard = ({ nomina, onCalcular, onCerrar, onViewDetails }) => {
    return (
        <div className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg p-5 border border-gray-200 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{nomina.descripcion}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Del {nomina.fecha_inicio} al {nomina.fecha_fin}
                    </p>
                </div>
                <StatusBadge status={nomina.estado} />
            </div>

            <div className="flex justify-between items-center text-sm border-t border-b border-gray-50 py-2">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Total Neto</span>
                    <span className="font-bold text-gray-900 text-lg">
                        ${parseFloat(nomina.total_neto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400">ID: {nomina.id}</span>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-auto pt-2">
                {/* Acciones segun estado */}
                {nomina.estado === 'BORRADOR' && (
                    <button
                        onClick={() => onCalcular(nomina)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Calculator size={16} /> Calcular Nómina
                    </button>
                )}

                {(nomina.estado === 'CALCULADA' || nomina.estado === 'TIMBRADA') && (
                    <>
                        <button
                            onClick={() => onViewDetails && onViewDetails(nomina.id)}
                            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Eye size={16} /> Detalles
                        </button>

                        {nomina.estado === 'CALCULADA' && (
                            <button
                                onClick={() => onCerrar(nomina)}
                                className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Lock size={16} /> Cerrar
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
