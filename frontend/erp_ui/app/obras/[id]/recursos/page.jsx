"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function ResourceDashboard() {
    const { id: obra_id } = useParams();
    const [asignaciones, setAsignaciones] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        actividad: "",
        tipo_recurso: "LABOR",
        recurso_id: "",
        cantidad_asignada: 1,
        porcentaje_dedicacion: 100,
        fecha_inicio: "",
        fecha_fin: ""
    });

    useEffect(() => {
        fetchData();
    }, [obra_id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resAsig, resAct] = await Promise.all([
                fetch(`http://localhost:8000/api/obras/recursos/?actividad__obra=${obra_id}`),
                fetch(`http://localhost:8000/api/obras/actividades/?obra=${obra_id}`)
            ]);

            const dataAsig = await resAsig.json();
            const dataAct = await resAct.json();

            setAsignaciones(dataAsig);
            setActividades(dataAct);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8000/api/obras/recursos/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (response.ok) {
                if (result.conflictos && result.conflictos.sobre_asignado) {
                    alert(`Asignado con advertencia: ${result.conflictos.mensaje}`);
                }
                setShowForm(false);
                fetchData();
            } else {
                alert(`Error: ${result.detail}`);
            }
        } catch (error) {
            alert("Error en la conexión");
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando recursos...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Gestión de Recursos
                    </h1>
                    <p className="text-slate-400">Asignación de personal, maquinaria y materiales</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <span>+</span> Asignar Recurso
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-semibold mb-4">Nueva Asignación</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Actividad</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                value={formData.actividad}
                                onChange={e => setFormData({ ...formData, actividad: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar actividad...</option>
                                {actividades.map(act => (
                                    <option key={act.id} value={act.id}>{act.codigo} - {act.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Tipo de Recurso</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                value={formData.tipo_recurso}
                                onChange={e => setFormData({ ...formData, tipo_recurso: e.target.value })}
                            >
                                <option value="LABOR">Mano de Obra</option>
                                <option value="EQUIPO">Maquinaria/Equipo</option>
                                <option value="MATERIAL">Material</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">ID del Recurso</label>
                            <input
                                type="number"
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                value={formData.recurso_id}
                                onChange={e => setFormData({ ...formData, recurso_id: e.target.value })}
                                placeholder="ID del Empleado/Equipo"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Cantidad / Dedicación %</label>
                            <input
                                type="number"
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                value={formData.tipo_recurso === 'LABOR' ? formData.porcentaje_dedicacion : formData.cantidad_asignada}
                                onChange={e => {
                                    if (formData.tipo_recurso === 'LABOR') {
                                        setFormData({ ...formData, porcentaje_dedicacion: e.target.value });
                                    } else {
                                        setFormData({ ...formData, cantidad_asignada: e.target.value });
                                    }
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Inicio</label>
                            <input
                                type="date"
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                value={formData.fecha_inicio}
                                onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Fin</label>
                            <input
                                type="date"
                                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2"
                                value={formData.fecha_fin}
                                onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-medium">Confirmar Asignación</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-semibold text-lg">Asignaciones Actuales</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Actividad</th>
                                        <th className="px-6 py-3 text-left">Recurso</th>
                                        <th className="px-6 py-3 text-left">Tipo</th>
                                        <th className="px-6 py-3 text-right">Dedicación/Cant.</th>
                                        <th className="px-6 py-3 text-left">Periodo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {asignaciones.map((asig) => (
                                        <tr key={asig.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">{asig.actividad}</td>
                                            <td className="px-6 py-4 text-slate-300">{asig.recurso_nombre}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${asig.tipo_recurso === 'LABOR' ? 'bg-blue-900/40 text-blue-300 border border-blue-800' :
                                                        asig.tipo_recurso === 'EQUIPO' ? 'bg-amber-900/40 text-amber-300 border border-amber-800' :
                                                            'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                                                    }`}>
                                                    {asig.tipo_recurso}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {asig.tipo_recurso === 'LABOR' ? `${asig.porcentaje_dedicacion}%` : asig.cantidad_asignada}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {asig.fecha_inicio} al {asig.fecha_fin}
                                            </td>
                                        </tr>
                                    ))}
                                    {asignaciones.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No hay recursos asignados a esta obra</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                        <h3 className="font-semibold text-lg mb-4 text-emerald-400">Resumen de Utilización</h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-900/50 rounded-lg">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Mano de Obra</span>
                                    <span className="text-emerald-400">65%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-lg">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Maquinaria Crítica</span>
                                    <span className="text-amber-400">82%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl border-l-4 border-l-red-500">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-red-400">
                            <span className="text-xl">⚠️</span> Conflictos Detectados
                        </h3>
                        <div className="space-y-3">
                            <div className="text-sm p-3 bg-red-900/20 border border-red-900/40 rounded-lg">
                                <p className="font-medium text-red-200">Sobre-asignación: Juan Pérez</p>
                                <p className="text-red-400/80 text-xs mt-1">150% de dedicación entre "Cimentación" y "Arranque Muros".</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
