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
 * - initialStartMonth (string)
 * - initialEndMonth (string)
 * - asArea (bool) -> si quieres área en vez de líneas
 */
export default function FlujoCobranzaChart({ raw, initialStartMonth, initialEndMonth, asArea = false }) {
    // Construye (meses) únicos a partir de labels tipo "Marzo", "Abril", etc.
    // Si tus labels ya vienen como "2025-03", mejor usa eso directo.
    const months = useMemo(() => raw?.labels ?? [], [raw]);

    // Meses seleccionados
    const [startMonth, setStartMonth] = useState(initialStartMonth || (months[0] ?? ''));
    const [endMonth, setEndMonth] = useState(initialEndMonth || (months[months.length - 1] ?? ''));

    useEffect(() => {
        if (months.length) {
            setStartMonth((prev) => prev || initialStartMonth || months[0]);
            setEndMonth((prev) => prev || initialEndMonth || months[months.length - 1]);
        }
    }, [months, initialStartMonth, initialEndMonth]);

    // Data para la gráfica (todos los meses) y Tremor
    const chartData = useMemo(() => {
        const labels = raw?.labels ?? [];
        const cob = raw?.recuperado ?? [];
        const por = raw?.programado ?? [];

        return labels.map((label, i) => ({
            label,
            Cobrado: Number(cob[i] ?? 0),
            'Por Cobrar': Number(por[i] ?? 0),
        }));
    }, [raw]);

    // Filtra datos según rango seleccionado
    const filteredData = useMemo(() => {
        const startIdx = months.indexOf(startMonth);
        const endIdx = months.indexOf(endMonth);
        if (startIdx === -1 || endIdx === -1) return chartData;
        const [s, e] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        return chartData.slice(s, e + 1);
    }, [chartData, startMonth, endMonth, months]);

    const Chart = asArea ? AreaChart : LineChart;

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Flujo de Ingresos y Egresos</h3>
                    <p className="text-sm text-gray-500">
                        Cobrado vs Por Cobrar
                    </p>
                </div>

                {/* Selectores de rango de meses */}
                {months.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Select
                            value={startMonth}
                            onValueChange={setStartMonth}
                            className="max-w-[160px]"
                        >
                            {months.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </Select>
                        <span className="text-sm">a</span>
                        <Select
                            value={endMonth}
                            onValueChange={setEndMonth}
                            className="max-w-[160px]"
                        >
                            {months.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                )}
            </div>

            <Chart
                className="w-full h-72"
                data={filteredData}
                index="label"
                categories={['Cobrado', 'Por Cobrar']}
                // Colores: emerald, amber
                colors={['emerald', 'amber']}
                valueFormatter={money}
                yAxisWidth={64}
                showLegend
                curveType="linear"
            />
        </Card>
    );
}
