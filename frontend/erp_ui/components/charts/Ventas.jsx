// components/VentasChart.jsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// Función para formatear los números como moneda local (MXN)
const valueFormatter = (number) =>
    `$${new Intl.NumberFormat('es-MX').format(number).toString()}`;

// Componente Tooltip personalizado para Recharts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        const formattedValue = valueFormatter(value);
        return (
            <div className="p-2 border rounded-md shadow-lg bg-white/80 backdrop-blur-md border-gray-200">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-sm text-cyan-600">
                    Ventas: {formattedValue}
                </p>
            </div>
        );
    }
    return null;
};

/**
 * Muestra una gráfica lineal de las ventas a lo largo del tiempo.
 * @param {{ data: any[] }} props
 * @prop {Array} data - Arreglo de datos para la gráfica. Ejemplo: [{ "label": "Ene 25", "Ventas": 98745 }, ...]
 */
export default function VentasChart({ data }) {

    if (!data || data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Ventas</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-gray-500">
                        No hay datos de ventas para mostrar.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ventas</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>

                        {/* Rejilla y Ejes */}
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="label" stroke="#888888" fontSize={12} />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickFormatter={valueFormatter}
                            width={60}
                        />

                        {/* Tooltip */}
                        <Tooltip content={<CustomTooltip />} />

                        {/* Línea de datos */}
                        <Line
                            type="monotone"
                            dataKey="Ventas"
                            stroke="#06b6d4" // Tailwind: cian
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}