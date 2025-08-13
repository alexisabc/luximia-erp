// components/VentasChart.jsx
'use client';

import { Card, Title, LineChart } from '@tremor/react';

// Una función útil para formatear los números como moneda local (MXN)
const valueFormatter = (number) =>
    `$${new Intl.NumberFormat('es-MX').format(number).toString()}`;

/**
 * Muestra una gráfica lineal de las ventas a lo largo del tiempo.
 * @param {{ data: any[] }} props
 * @prop {Array} data - Arreglo de datos para la gráfica.
 * Ejemplo: [{ "label": "Ene 25", "Ventas": 98745 }, ...]
 */
export default function VentasChart({ data }) {
    // Si no hay datos, muestra un mensaje amigable.
    if (!data || data.length === 0) {
        return (
            <Card>
                <Title>Ventas</Title>
                <div className="flex items-center justify-center h-full pt-6">
                    <p className="text-tremor-content dark:text-dark-tremor-content">
                        No hay datos de ventas para mostrar.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <Title>Ventas</Title>
            <LineChart
                className="mt-6"
                data={data}
                index="label" // La propiedad del objeto que va en el eje X (las fechas/periodos)
                categories={['Ventas']} // La propiedad del objeto con los valores del eje Y
                colors={['cyan']} // El color de la línea de la gráfica
                valueFormatter={valueFormatter} // La función que formatea los números del tooltip
                yAxisWidth={60}
                showLegend={false}
            />
        </Card>
    );
}