import React from 'react';

const SemaforoPresupuestal = ({ categoria, estimado, comprometido, gastado }) => {
    const totalUsado = comprometido + gastado;
    // Evitar división por cero
    const porcentaje = estimado > 0 ? (totalUsado / estimado) * 100 : 0;

    let color = "bg-green-500";
    if (porcentaje > 70) color = "bg-yellow-500";
    if (porcentaje > 90) color = "bg-red-500";
    if (porcentaje > 100) color = "bg-purple-600"; // Overrun

    return (
        <div className="w-full p-2 border rounded shadow-sm bg-white">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold">{categoria}</span>
                <span className="text-gray-600">
                    ${totalUsado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} /
                    ${estimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`${color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                ></div>
            </div>
            <div className="text-xs text-right mt-1 text-gray-500">
                {porcentaje.toFixed(1)}% Usado
            </div>
        </div>
    );
};

export default SemaforoPresupuestal;
