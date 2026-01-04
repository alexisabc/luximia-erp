'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function FinancialBarChart({ data, xKey = 'name', yKey = 'value', color = '#3b82f6' }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No hay datos disponibles
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey={yKey} fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
