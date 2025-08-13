// components/FlujoCobranzaChart.jsx
'use client';

import { Card, Title, Subtitle, LineChart } from '@tremor/react';

// Función para formatear los números como moneda
const moneyFormatter = (number) =>
    `$${new Intl.NumberFormat('es-MX').format(number).toString()}`;

/**
 * Muestra una gráfica de dos líneas: Cobrado vs. Por Cobrar.
 * @param {{ data: any[] }} props
 * @prop {Array} data - Arreglo de datos para la gráfica.
 * Ejemplo: [{ label: 'Ene 25', 'Cobrado': 50000, 'Por Cobrar': 75000 }, ...]
 */
export default function FlujoCobranzaChart({ data }) {
    // Verificamos si los datos son válidos para evitar errores.
    // Si no hay datos o el arreglo está vacío, no se renderiza nada.
    if (!data || data.length === 0) {
        return (
            <Card>
                <Title>Flujo de Cobranza</Title>
                <div className="flex items-center justify-center h-full">
                    <p className="text-tremor-content dark:text-dark-tremor-content">
                        No hay datos para mostrar.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <Title>Flujo de Cobranza</Title>
            <Subtitle>Cobrado vs. Por Cobrar</Subtitle>
            <LineChart
                className="mt-6"
                data={data}
                index="label"
                categories={['Cobrado', 'Por Cobrar']}
                colors={['emerald', 'amber']} // Verde para "Cobrado", Ámbar para "Por Cobrar"
                valueFormatter={moneyFormatter}
                yAxisWidth={60}
                showLegend={true}
            />
        </Card>
    );
}