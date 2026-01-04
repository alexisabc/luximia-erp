"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileEdit, CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react";

export default function ChangeManagementPage() {
    const { id: obra_id } = useParams();
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Data for selects
    const [partidas, setPartidas] = useState([]);
    const [actividades, setActividades] = useState([]);

    const [formData, setFormData] = useState({
        tipo: "ADITIVA",
        justificacion: "",
        monto_impacto: 0,
        dias_impacto: 0,
        partida: "",
        actividad: "",
        obra: obra_id
    });

    useEffect(() => {
        fetchData();
        fetchContextData();
    }, [obra_id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/api/obras/ordenes-cambio/?obra=${obra_id}`);
            const data = await res.json();
            setOrdenes(data);
        } catch (error) {
            console.error("Error fetching change orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContextData = async () => {
        try {
            // Simplificado: obtener todas las partidas y actividades para el form
            const [resPart, resAct] = await Promise.all([
                fetch(`http://localhost:8000/api/obras/centros-costos/?obra=${obra_id}`), // Necesitaríamos un endpoint de partidas planas
                fetch(`http://localhost:8000/api/obras/actividades/?obra=${obra_id}`)
            ]);
            const dataAct = await resAct.json();
            setActividades(dataAct);
            // For simplicity in this demo, we'll assume we have the IDs or can fetch them
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`http://localhost:8000/api/obras/ordenes-cambio/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, obra: obra_id })
            });
            if (resp.ok) {
                setShowForm(false);
                fetchData();
            }
        } catch (e) { }
    };

    const handleAction = async (id, action) => {
        try {
            const resp = await fetch(`http://localhost:8000/api/obras/ordenes-cambio/${id}/${action}/`, {
                method: "POST"
            });
            if (resp.ok) fetchData();
        } catch (e) { }
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando gestión de cambios...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Gestión de Cambios
                    </h1>
                    <p className="text-slate-400">Control de Aditivas, Deductivas y Reprogramaciones</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus size={18} /> Nueva Solicitud
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 shadow-2xl animate-in zoom-in-95">
                    <h2 className="text-xl font-semibold mb-6">Solicitar Orden de Cambio</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tipo de Cambio</label>
                                <select
                                    className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                    value={formData.tipo}
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                >
                                    <option value="ADITIVA">Aditiva (Presupuesto +)</option>
                                    <option value="DEDUCTIVA">Deductiva (Presupuesto -)</option>
                                    <option value="REPROGRAMACION">Reprogramación (Tiempos)</option>
                                </select>
                            </div>
                            <div>
                                {formData.tipo !== 'REPROGRAMACION' ? (
                                    <>
                                        <label className="block text-sm text-slate-400 mb-1">Monto de Impacto</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                            value={formData.monto_impacto}
                                            onChange={e => setFormData({ ...formData, monto_impacto: e.target.value })}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-sm text-slate-400 mb-1">Días de Impacto</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                            value={formData.dias_impacto}
                                            onChange={e => setFormData({ ...formData, dias_impacto: e.target.value })}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Justificación</label>
                            <textarea
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2 h-24"
                                value={formData.justificacion}
                                onChange={e => setFormData({ ...formData, justificacion: e.target.value })}
                                placeholder="Explique el motivo del cambio..."
                                required
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-medium"
                            >
                                Enviar Solicitud
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List of Orders */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full">
                    <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4 text-left">Folio / Fecha</th>
                            <th className="px-6 py-4 text-left">Tipo</th>
                            <th className="px-6 py-4 text-left">Impacto</th>
                            <th className="px-6 py-4 text-left">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {ordenes.map((oc) => (
                            <tr key={oc.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-200">{oc.folio}</div>
                                    <div className="text-xs text-slate-500">{oc.fecha_solicitud}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${oc.tipo === 'ADITIVA' ? 'bg-blue-900/40 text-blue-300' :
                                            oc.tipo === 'DEDUCTIVA' ? 'bg-red-900/40 text-red-300' :
                                                'bg-purple-900/40 text-purple-300'
                                        }`}>
                                        {oc.tipo}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {oc.tipo === 'REPROGRAMACION' ? `${oc.dias_impacto} días` : `$${parseFloat(oc.monto_impacto).toLocaleString()}`}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1 text-sm ${oc.estado === 'AUTORIZADA' ? 'text-emerald-400' :
                                            oc.estado === 'RECHAZADA' ? 'text-red-400' :
                                                'text-amber-400'
                                        }`}>
                                        {oc.estado === 'AUTORIZADA' && <CheckCircle size={14} />}
                                        {oc.estado === 'RECHAZADA' && <XCircle size={14} />}
                                        {oc.estado === 'SOLICITADA' && <AlertTriangle size={14} />}
                                        {oc.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {oc.estado === 'SOLICITADA' && (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(oc.id, 'rechazar')}
                                                className="p-2 hover:bg-red-900/20 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-900/40"
                                                title="Rechazar"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(oc.id, 'autorizar')}
                                                className="p-2 hover:bg-emerald-900/20 text-emerald-500 rounded-lg transition-colors border border-transparent hover:border-emerald-900/40"
                                                title="Autorizar"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        </div>
                                    )}
                                    {oc.estado !== 'SOLICITADA' && (
                                        <div className="text-xs text-slate-500 italic">
                                            Por: {oc.autorizado_por_nombre || 'Sist.'}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {ordenes.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No hay órdenes de cambio registradas</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Notas de Implementación</h3>
                    <ul className="text-sm text-slate-500 space-y-2 list-disc pl-4">
                        <li>Las aditivas incrementan el presupuesto disponible de forma inmediata tras ser autorizadas.</li>
                        <li>Las reprogramaciones recalculan automáticamente la ruta crítica y fechas de sucesoras.</li>
                        <li>Todo cambio queda registrado en el historial audituable de la obra.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
