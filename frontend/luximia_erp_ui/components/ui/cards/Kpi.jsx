// components/KpiCard.jsx
'use client';

import React from 'react';

/**
 * Muestra una tarjeta con un Indicador Clave de Rendimiento (KPI).
 * @param {{ title: string, value: number }} props
 * @prop {string} title - El título del KPI (ej. "Total en Ventas").
 * @prop {number} value - El valor numérico del KPI.
 */
export default function KpiCard({ title, value }) {
    // Nos aseguramos de que el valor sea un número, si no, lo convertimos en 0.
    const numberValue = Number(value ?? 0);

    return (
        <div className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                {title}
            </h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {/* Formatea el número como moneda MXN con dos decimales */}
                {`$${numberValue.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`}
            </p>
        </div>
    );
}