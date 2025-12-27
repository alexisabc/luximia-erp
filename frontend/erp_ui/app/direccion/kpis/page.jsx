'use client';

import React, { useState, useEffect } from 'react';
import { Card, Select, Statistic, Row, Col, Spin, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import apiClient from '@/services/api';

const { Option } = Select;

export default function KPIDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [timeframe, setTimeframe] = useState('month'); // month, year, week
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [timeframe]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/dashboard/strategic/', { params: { timeframe } });
            setData(res.data);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los datos del dashboard.");
        } finally {
            setLoading(false);
        }
    };

    const currencyFormatter = (value) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    };

    if (loading && !data) return <div className="p-12 flex justify-center"><Spin size="large" /></div>;
    if (error) return <div className="p-8"><Alert message="Error" description={error} type="error" showIcon /></div>;

    const { kpis, chart } = data || {};

    // Prepare chart data
    const chartData = chart?.labels?.map((label, idx) => ({
        name: label,
        Ventas: parseFloat(chart.ventas[idx] || 0),
        Recuperado: parseFloat(chart.recuperado[idx] || 0),
        Programado: parseFloat(chart.programado[idx] || 0)
    })) || [];

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-blue-600" />
                    Dashboard Estratégico
                </h1>
                <div className="flex items-center gap-2">
                    <Calendar className="text-gray-400 w-4 h-4" />
                    <Select value={timeframe} onChange={setTimeframe} style={{ width: 150 }}>
                        <Option value="week">Esta Semana</Option>
                        <Option value="month">Este Mes</Option>
                        <Option value="year">Este Año</Option>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                    <Statistic
                        title="Ventas Totales"
                        value={kpis?.ventas}
                        prefix={<DollarSign size={16} />}
                        precision={2}
                        formatter={currencyFormatter}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
                <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                    <Statistic
                        title="Recuperado (Cobrado)"
                        value={kpis?.recuperado}
                        prefix={<DollarSign size={16} />}
                        precision={2}
                        formatter={currencyFormatter}
                        valueStyle={{ color: '#1677ff' }}
                    />
                </Card>
                <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                    <Statistic
                        title="Por Cobrar"
                        value={kpis?.por_cobrar}
                        prefix={<DollarSign size={16} />}
                        precision={2}
                        formatter={currencyFormatter}
                        valueStyle={{ color: '#faad14' }}
                    />
                </Card>
                <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                    <Statistic
                        title="Vencido"
                        value={kpis?.vencido}
                        prefix={<AlertCircle size={16} />}
                        precision={2}
                        formatter={currencyFormatter}
                        valueStyle={{ color: '#cf1322' }}
                    />
                </Card>
            </div>

            {/* Chart */}
            <Card title="Tendencia de Venta vs Cobranza" bordered={false} className="shadow-sm">
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRecup" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `$${val / 1000}k`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip formatter={(value) => currencyFormatter(value)} />
                            <Legend />
                            <Area type="monotone" dataKey="Ventas" stroke="#82ca9d" fillOpacity={1} fill="url(#colorVentas)" />
                            <Area type="monotone" dataKey="Recuperado" stroke="#8884d8" fillOpacity={1} fill="url(#colorRecup)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
