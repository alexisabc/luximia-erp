'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, AreaChart, Card, Select, SelectItem } from '@tremor/react';

// Util: $ formateado
const money = (n) =>
    `$${Number(n ?? 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

/**
 * props:
 * - raw (obj) -> { labels: string[], recuperado: number[], programado: number[], vencido: number[] }
 * - initialMonth (string) -> ej "2025-06"
 * - asArea (bool) -> si quieres área en vez de líneas
 */
export default function FlujoCobranzaChart({ raw, initialMonth, asArea = false }) {
    // Construye (meses) únicos a partir de labels tipo "Marzo", "Abril", etc.
    // Si tus labels ya vienen como "2025-03", mejor usa eso directo.
    const months = useMemo(() => raw?.labels ?? [], [raw]);

    // Mes seleccionado (último por defecto o initialMonth)
    const [selectedMonth, setSelectedMonth] = useState(
        initialMonth ||
        (months.length ? months[months.length - 1] : '')
    );

    useEffect(() => {
        if (!selectedMonth && months.length) {
            setSelectedMonth(months[months.length - 1]);
        }
    }, [months, selectedMonth]);

    // Data para la gráfica (todos los meses) y Tremor
    const chartData = useMemo(() => {
        const labels = raw?.labels ?? [];
        const cob = raw?.recuperado ?? [];
        const por = raw?.programado ?? [];
        const mor = raw?.vencido ?? [];

        return labels.map((label, i) => ({
            label,
            Cobrado: Number(cob[i] ?? 0),
            'Por Cobrar': Number(por[i] ?? 0),
            Morosidad: Number(mor[i] ?? 0),
        }));
    }, [raw]);

    // Si quieres filtrar por una ventana móvil (p. ej. últimos 4 meses respecto a selectedMonth)
    // aquí podrías cortar chartData según selectedMonth. Por ahora mostramos todo el rango.

    const Chart = asArea ? AreaChart : LineChart;

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Flujo de Ingresos y Egresos</h3>
                    <p className="text-sm text-gray-500">
                        Cobrado vs Por Cobrar vs Morosidad
                    </p>
                </div>

                {/* Selector de mes (solo decorativo ahora; úsalo para filtrar si lo necesitas) */}
                {months.length > 0 && (
                    <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                        className="max-w-[180px]"
                    >
                        {months.map((m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        ))}
                    </Select>
                )}
            </div>

            <Chart
                className="w-full h-72"
                data={chartData}
                index="label"
                categories={['Cobrado', 'Por Cobrar', 'Morosidad']}
                // Colores: emerald, amber, rose
                colors={['emerald', 'amber', 'rose']}
                valueFormatter={money}
                yAxisWidth={64}
                showLegend
            // Para LineChart, curva lineal por defecto; si quieres suavizada: curveType="monotone"
            // curveType="monotone"
            />
        </Card>
    );
}
