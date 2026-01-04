"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CostControlDashboard() {
    const { id: obra_id } = useParams();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, [obra_id]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/api/obras/obras/${obra_id}/evm-metrics/`);
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error("Error fetching metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Calculando métricas EVM...</div>;
    if (!metrics) return <div className="p-8 text-center text-red-400">Error al cargar datos</div>;

    const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Control de Costos (EVM)
                </h1>
                <p className="text-slate-400">Análisis de Valor Ganado y Variaciones del Proyecto</p>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title="Planned Value (PV)" value={formatCurrency(metrics.pv)} subtitle="Lo que deberíamos haber gastado" icon={<Activity className="text-blue-400" />} />
                <MetricCard title="Earned Value (EV)" value={formatCurrency(metrics.ev)} subtitle="Valor del trabajo realizado" icon={<CheckCircle2 className="text-emerald-400" />} />
                <MetricCard title="Actual Cost (AC)" value={formatCurrency(metrics.ac)} subtitle="Lo que realmente gastamos" icon={<TrendingUp className="text-purple-400" />} />
                <MetricCard
                    title="CV / SV"
                    value={`${formatCurrency(metrics.cv)} / ${formatCurrency(metrics.sv)}`}
                    subtitle="Variación de Costo y Programa"
                    icon={<AlertCircle className={metrics.cv < 0 ? "text-red-400" : "text-emerald-400"} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Indices */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            Índices de Desempeño
                        </h3>
                        <div className="space-y-8">
                            <IndexGauge label="CPI (Costo)" value={metrics.cpi} />
                            <IndexGauge label="SPI (Programa)" value={metrics.spi} />
                        </div>
                        <div className="mt-8 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                            <p className="text-sm text-slate-400">
                                {metrics.cpi < 1 ? "⚠️ El proyecto está excediendo el presupuesto." : "✅ El desempeño de costo es eficiente."}
                            </p>
                            <p className="text-sm text-slate-400 mt-2">
                                {metrics.spi < 1 ? "⚠️ El proyecto está atrasado respecto al plan." : "✅ El cronograma se está cumpliendo."}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Estado de Salud</h3>
                        <div className={`p-4 rounded-xl text-center font-bold text-xl ${metrics.status === 'HEALTHY' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' :
                                metrics.status === 'WARNING' ? 'bg-amber-900/30 text-amber-400 border border-amber-800' :
                                    'bg-red-900/30 text-red-400 border border-red-800'
                            }`}>
                            {metrics.status === 'HEALTHY' ? 'PROYECTO SANO' :
                                metrics.status === 'WARNING' ? 'NECESITA ATENCIÓN' : 'ESTADO CRÍTICO'}
                        </div>
                    </div>
                </div>

                {/* S-Curve Visualization Placeholder */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Visualización de Curva S</h3>
                            <div className="flex gap-4 text-xs">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> PV</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> EV</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> AC</span>
                            </div>
                        </div>

                        {/* Mock Curva S con CSS */}
                        <div className="relative h-64 mt-12 flex items-end justify-between px-4 border-b border-l border-slate-700">
                            <div className="absolute left-0 bottom-0 w-full h-full opacity-10 pointer-events-none">
                                {/* Grid lines */}
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-full h-px bg-slate-500" style={{ bottom: `${i * 25}%` }}></div>
                                ))}
                            </div>
                            <div className="w-full h-48 flex items-end">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                    {/* Curva PV */}
                                    <path d="M0,180 Q100,150 200,100 T400,20" fill="none" stroke="#3b82f6" strokeWidth="3" />
                                    {/* Curva EV */}
                                    <path d="M0,180 Q100,170 200,130 T300,80" fill="none" stroke="#10b981" strokeWidth="3" />
                                    {/* Curva AC */}
                                    <path d="M0,180 Q100,165 200,120 T300,60" fill="none" stroke="#a855f7" strokeWidth="3" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-slate-500">
                            <span>Inicio Projecto</span>
                            <span>Hoy (Corte)</span>
                            <span>Fin Planeado</span>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/40 rounded-xl">
                                <div className="text-xs text-slate-500 mb-1">Presupuesto al Final (BAC)</div>
                                <div className="text-xl font-bold">{formatCurrency(metrics.bac)}</div>
                            </div>
                            <div className="p-4 bg-slate-900/40 rounded-xl">
                                <div className="text-xs text-slate-500 mb-1">Estimación al Final (EAC)</div>
                                <div className="text-xl font-bold text-amber-400">{formatCurrency(metrics.bac / metrics.cpi)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon }) {
    return (
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg hover:border-slate-600 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-900/50 rounded-lg">{icon}</div>
            </div>
            <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
    );
}

function IndexGauge({ label, value }) {
    const percentage = Math.min(value * 50, 100); // 1.0 = 50%, 2.0 = 100% para visualización
    const color = value >= 1 ? 'emerald' : value >= 0.8 ? 'amber' : 'red';

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span>{label}</span>
                <span className={`font-bold text-${color}-400 text-lg`}>{value.toFixed(2)}</span>
            </div>
            <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden border border-slate-700">
                <div
                    className={`h-full bg-${color}-500 transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
