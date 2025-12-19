// components/FlujoCobranzaChart.jsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Función para formatear los números como moneda (MXN)
const moneyFormatter = (number) => {
    if (number === undefined || number === null) return '';
    return `$${new Intl.NumberFormat('es-MX').format(number).toString()}`;
};

// Componente Tooltip personalizado para Recharts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 border rounded-md shadow-lg bg-white/80 backdrop-blur-md border-gray-200">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                {payload.map((p) => (
                    <p key={p.dataKey} style={{ color: p.color }} className="text-sm">
                        {p.dataKey}: {moneyFormatter(p.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

/**
 * Muestra una gráfica de dos líneas: Cobrado vs. Por Cobrar.
 * @param {{ data: any[] }} props
 * @prop {Array} data - Arreglo de datos para la gráfica. Ejemplo: [{ label: 'Ene 25', 'Cobrado': 50000, 'Por Cobrar': 75000 }, ...]
 */
export default function FlujoCobranzaChart({ data }) {

    // Contenedor 'Card' de Shadcn para el mensaje de no hay datos
    if (!data || data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Flujo de Cobranza</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-gray-500">
                        No hay datos para mostrar.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Contenedor 'Card' de Shadcn para la gráfica
    return (
        <Card>
            <CardHeader>
                <CardTitle>Flujo de Cobranza</CardTitle>
                <p className="text-sm text-muted-foreground">Cobrado vs. Por Cobrar</p>
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
                            tickFormatter={moneyFormatter}
                            width={60}
                        />

                        {/* Tooltip y Leyenda */}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />

                        {/* Líneas de datos */}
                        <Line
                            type="monotone"
                            dataKey="Cobrado"
                            stroke="#059669" // Tailwind: esmeralda
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Por Cobrar"
                            stroke="#f59e0b" // Tailwind: ámbar
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}