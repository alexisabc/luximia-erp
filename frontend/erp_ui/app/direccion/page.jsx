'use client';

import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/Card';
import {
    TrendingUp, TrendingDown, Users, Briefcase, Activity,
    DollarSign, AlertTriangle, CheckCircle2, MoreHorizontal,
    PieChart as PieChartIcon, BarChart2, ArrowUpRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { getDashboardData } from '@/services/direccion';
import Overlay from '@/components/loaders/Overlay';
import { useAuth } from '@/context/AuthContext';

// --- COMPONENTS ---

const StatCard = ({ title, value, difference, trend, icon: Icon, colorClass }) => (
    <Card className="relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 border-border/50 shadow-sm hover:shadow-lg">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
            <Icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
        </div>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Icon className={`w-4 h-4 ${colorClass.replace('text-', 'text-opacity-80 text-')}`} />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-extrabold tracking-tight mb-1">{value}</div>
            <p className={`text-xs font-bold flex items-center ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {difference}
                <span className="text-muted-foreground ml-1 font-medium">vs mes anterior</span>
            </p>
        </CardContent>
    </Card>
);

const ActivityItem = ({ type, message, time }) => {
    let icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
    let bg = "bg-green-500/10";
    if (type === 'ALERT') {
        icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
        bg = "bg-red-500/10";
    } else if (type === 'INFO') {
        icon = <Activity className="w-4 h-4 text-blue-500" />;
        bg = "bg-blue-500/10";
    }

    return (
        <div className="flex gap-3 items-start p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <div className={`p-2 rounded-lg flex-shrink-0 ${bg}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0 md:min-w-fit">
                <p className="text-sm font-medium text-foreground leading-tight">{message}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {time}
                </p>
            </div>
        </div>
    );
};

const ClockIcon = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

// --- MAIN PAGE ---

export default function DireccionDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getDashboardData();
                setData(res.data);
            } catch (error) {
                console.error("Dashboard Load Error", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <Overlay />;

    // Format utility
    const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-20 overflow-y-auto h-full custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/40 pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <BarChart2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        Tablero Directivo
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-base">
                        Bienvenido, <span className="font-bold text-foreground">{user?.first_name || 'Director'}</span>.
                        Aquí tienes el resumen ejecutivo de la operación en tiempo real.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Actualizado en tiempo real
                    </div>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos Totales (YTD)"
                    value={formatCurrency(data.stats.totalRevenue)}
                    difference={`${data.stats.revenueGrowth}%`}
                    trend="up"
                    icon={DollarSign}
                    colorClass="text-emerald-600"
                />
                <StatCard
                    title="Utilidad Neta"
                    value={formatCurrency(data.stats.netProfit)}
                    difference={`${data.stats.profitMargin}% Mg.`}
                    trend="up"
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Proyectos Activos"
                    value={data.stats.activeProjects}
                    difference={`${data.stats.projectsAtRisk} en riesgo`}
                    trend="down" // Down because risk is bad? or simply neutral. Let's keep style.
                    icon={Briefcase}
                    colorClass="text-amber-500"
                />
                <StatCard
                    title="Capital Humano"
                    value={data.stats.activeEmployees}
                    difference={`+${data.stats.employeeGrowth} este mes`}
                    trend="up"
                    icon={Users}
                    colorClass="text-violet-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[400px]">
                {/* Main Chart (Revenue) */}
                <Card className="xl:col-span-2 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Tendencia de Ingresos vs Gastos</span>
                            <button className="p-2 hover:bg-muted rounded-full transition"><MoreHorizontal className="w-5 h-5 text-muted-foreground" /></button>
                        </CardTitle>
                        <CardDescription>Comportamiento financiero del primer semestre</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Secondary Section (Pie + List) */}
                <div className="space-y-6">
                    {/* Project Status Pie */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Salud de Proyectos</CardTitle>
                            <CardDescription>Distribución por estado de riesgo</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.projectStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.projectStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text Trick */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-extrabold">{data.stats.activeProjects}</span>
                                <span className="text-xs text-muted-foreground uppercase">Totales</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="border-border/50 shadow-sm flex-1">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Actividad Reciente</CardTitle>
                                <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                    Ver todo <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {data.recentActivities.map(act => (
                                <ActivityItem
                                    key={act.id}
                                    type={act.type}
                                    message={act.message}
                                    time={act.time}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Actions / Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all font-bold text-sm flex items-center justify-center gap-2">
                    <PieChartIcon className="w-4 h-4" /> Generar Reporte Mensual
                </button>
                <button className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-border hover:bg-muted/50 transition-all font-bold text-sm flex items-center justify-center gap-2 text-foreground">
                    <Users className="w-4 h-4" /> Revisar Plantilla
                </button>
            </div>
        </div>
    );
}
