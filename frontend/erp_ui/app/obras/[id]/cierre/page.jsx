"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Lock, CheckCircle, BarChart3,
    DollarSign, TrendingUp, AlertCircle,
    Download, Archive
} from "lucide-react";

export default function ProjectClosurePage() {
    const { id: obra_id } = useParams();
    const [data, setData] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [liquidating, setLiquidating] = useState(false);

    useEffect(() => {
        fetchReport();
        fetchAccounts();
    }, [obra_id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/api/obras/${obra_id}/closure-report/`);
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching closure report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/tesoreria/cuentas/`);
            const result = await res.json();
            setAccounts(result.results || result);
        } catch (e) {
            console.error("Error fetching bank accounts:", e);
        }
    };

    const downloadPDF = () => {
        window.open(`http://localhost:8000/api/obras/${obra_id}/closure-pdf/`, "_blank");
    };

    const handleLiquidateRetentions = async () => {
        if (!selectedAccount) return alert("Seleccione una cuenta bancaria.");
        if (!confirm("¿Generar orden de pago para liberación de fondo de garantía?")) return;

        try {
            setLiquidating(true);
            const res = await fetch(`http://localhost:8000/api/obras/${obra_id}/liquidar-retenciones/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cuenta_id: selectedAccount })
            });
            if (res.ok) {
                const msg = await res.json();
                alert(msg.detail);
                fetchReport();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (e) {
            alert("Error de conexión.");
        } finally {
            setLiquidating(false);
        }
    };

    const handleCloseProject = async () => {
        if (!confirm("¿Está seguro de cerrar formalmente esta obra? Esta acción bloqueará nuevos cargos.")) return;

        try {
            setClosing(true);
            const res = await fetch(`http://localhost:8000/api/obras/${obra_id}/cerrar/`, {
                method: "POST"
            });
            if (res.ok) {
                alert("Obra cerrada exitosamente.");
                window.location.reload();
            } else {
                const error = await res.json();
                alert(`Error: ${error.detail}`);
            }
        } catch (e) {
            alert("Error al conectar con el servidor.");
        } finally {
            setClosing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Generando reporte de cierre...</div>;

    const { profitability, retentions } = data;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Archive size={32} /> Cierre de Proyecto
                    </h1>
                    <p className="text-slate-400">Post-mortem y Liquidación Final: {profitability.obra}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={downloadPDF}
                        className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
                    >
                        <Download size={18} /> Exportar Reporte
                    </button>
                    <button
                        onClick={handleCloseProject}
                        disabled={closing}
                        className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
                    >
                        <Lock size={18} /> {closing ? "Procesando..." : "Cerrar Obra"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Utilidad Final"
                    value={`$${profitability.utilidad_neta.toLocaleString()}`}
                    icon={<DollarSign className="text-emerald-400" />}
                    trend={`${profitability.margen_utilidad}% margen`}
                    color="emerald"
                />
                <MetricCard
                    title="Ingresos Totales"
                    value={`$${profitability.ingresos_totales.toLocaleString()}`}
                    icon={<BarChart3 className="text-blue-400" />}
                    trend="Real acumulado"
                    color="blue"
                />
                <MetricCard
                    title="Gastos Totales"
                    value={`$${profitability.gastos_totales.toLocaleString()}`}
                    icon={<TrendingUp className="text-orange-400" />}
                    trend="Costo Real"
                    color="orange"
                />
                <MetricCard
                    title="Retención Pendiente"
                    value={`$${retentions.pendiente.toLocaleString()}`}
                    icon={<AlertCircle className="text-amber-400" />}
                    trend="Fondo de Garantía"
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Desglose de Rentabilidad */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <CheckCircle className="text-emerald-500" /> Resumen de Liquidación
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                            <span className="text-slate-400">Presupuesto Original</span>
                            <span className="font-mono font-bold">${profitability.presupuesto_original.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                            <span className="text-slate-400">Ingresos Reales (Facturado)</span>
                            <span className="font-mono font-bold text-emerald-400">${profitability.ingresos_totales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                            <span className="text-slate-400">Egresos Financieros (Pagado)</span>
                            <span className="font-mono font-bold text-red-400">-${profitability.gastos_totales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                            <span className="text-slate-400">Costo de Nómina Asignado</span>
                            <span className="font-mono font-bold text-red-400">-${profitability.nomina_total.toLocaleString()}</span>
                        </div>
                        <hr className="border-slate-700 my-4" />
                        <div className="flex justify-between p-4 bg-slate-700/50 rounded-xl border border-emerald-500/30">
                            <span className="text-white font-bold text-lg">Utilidad Neta</span>
                            <span className="font-mono font-bold text-emerald-400 text-2xl">${profitability.utilidad_neta.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Estatus y Fondo de Garantía */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <AlertCircle className="text-amber-500" /> Fondo de Garantía
                    </h2>
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
                                    Estado de Retención
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-amber-500">
                                    {retentions.total_retenido > 0 ? "0%" : "100%"} Liberado
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-700">
                            <div
                                style={{ width: `${(retentions.liberado / retentions.total_retenido * 100) || 0}%` }}
                                className="shadow-none flex flex-col text-center white-space-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                            ></div>
                        </div>
                    </div>

                    {retentions.pendiente > 0 && (
                        <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-xl">
                            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                                Cuenta de Origen para Liquidación
                            </label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm mb-4"
                            >
                                <option value="">Seleccione cuenta...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.banco_nombre} - {acc.numero_cuenta} ({acc.moneda})</option>
                                ))}
                            </select>
                            <button
                                onClick={handleLiquidateRetentions}
                                disabled={liquidating}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 py-2 rounded-lg font-bold transition-all"
                            >
                                {liquidating ? "Procesando..." : "Liberar Fondo de Garantía"}
                            </button>
                        </div>
                    )}

                    <p className="text-sm text-slate-500 italic mb-6 mt-4">
                        El fondo de garantía se libera al ejecutar la orden de pago de liquidación final, sujeta a la aprobación de la fianza de vicios ocultos.
                    </p>
                    <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-xl">
                        <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                            <AlertCircle size={16} /> Próximos Pasos
                        </h4>
                        <ul className="text-xs text-amber-300/70 space-y-2 list-disc pl-4">
                            <li>Verificar que no existan retenciones de IMSS pendientes (SIROC).</li>
                            <li>Validar entrega de planos as-built.</li>
                            <li>Generar acta de entrega-recepción con el cliente.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, color }) {
    const colorMap = {
        emerald: "from-emerald-900/20 to-emerald-800/10 border-emerald-900/30 shadow-emerald-900/10",
        blue: "from-blue-900/20 to-blue-800/10 border-blue-900/30 shadow-blue-900/10",
        orange: "from-orange-900/20 to-orange-800/10 border-orange-900/30 shadow-orange-900/10",
        amber: "from-amber-900/20 to-amber-800/10 border-amber-900/30 shadow-amber-900/10",
    };

    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 shadow-lg backdrop-blur-sm`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-900/50 rounded-lg">
                    {icon}
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
            </div>
            <div className="text-2xl font-bold mb-1 tracking-tight text-white">{value}</div>
            <div className="text-xs text-slate-400 font-medium">{trend}</div>
        </div>
    );
}
