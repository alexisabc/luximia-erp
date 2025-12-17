// components/KpiCard.jsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

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
        <Card className="hover:scale-105 hover:bg-white dark:hover:bg-gray-800 border-l-4 border-l-blue-600 dark:border-l-blue-500">
            <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500 truncate dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
                <p className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200">
                    {/* Formatea el número. Si es muy grande (> 1 millón), usa notación compacta para evitar desbordes */}
                    {`$${numberValue.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        notation: numberValue > 1000000 ? 'compact' : 'standard',
                        compactDisplay: 'short'
                    })}`}
                </p>
            </CardContent>
        </Card>
    );
}