'use client';
import { useState } from 'react';
import { Package, Search, ArrowRight, CheckCircle } from 'lucide-react';
import apiClient from '@/services/core';

export default function RecepcionPage() {
    const [folio, setFolio] = useState('');
    const [orden, setOrden] = useState(null);
    const [cantidades, setCantidades] = useState({});
    const [folioRemision, setFolioRemision] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const buscarOrden = async () => {
        try {
            setError('');
            setSuccess('');
            setOrden(null);

            if (!folio) return;

            // Intentar buscar por folio exacto primero, o búsqueda general
            // Usamos endpoint estandar de ordenes
            const url = `/compras/ordenes/?search=${folio}`;
            const res = await apiClient.get(url);

            // Handle pagination results
            const resultados = Array.isArray(res.data) ? res.data : (res.data.results || []);

            if (resultados.length > 0) {
                // Tomamos el primero
                const ocSummary = resultados[0];

                // Obtenemos detalle completo para tener los items frescos
                const detailRes = await apiClient.get(`/compras/ordenes/${ocSummary.id}/`);
                setOrden(detailRes.data);
                setCantidades({});
            } else {
                setError('No se encontró ninguna orden con ese criterio.');
            }
        } catch (e) {
            console.error(e);
            setError('Error buscando la orden. Verifique conexión.');
        }
    };

    const handleCantidadChange = (insumoId, val) => {
        setCantidades({ ...cantidades, [insumoId]: val });
    };

    const confirmarRecepcion = async () => {
        if (!orden) return;

        // Construir payload
        const items = [];
        orden.detalles.forEach(d => {
            // El ID del insumo puede venir como d.insumo (si es integer) o d.insumo.id (si es objeto)
            // Depende del serializer. El OrdenCompraSerializer usa InsumoSerializer nested? Ver views.py
            // step 1281: line 28 detalles use select_related('insumo'). Serializer probablemente anida.
            // Asumiremos acceso seguro.
            const insumoId = typeof d.insumo === 'object' ? d.insumo.id : d.insumo;

            const val = cantidades[insumoId];
            if (val && parseFloat(val) > 0) {
                items.push({
                    producto_id: insumoId,
                    cantidad: parseFloat(val),
                    almacen_id: 1 // TODO: Selector dinámico de almacén
                });
            }
        });

        if (items.length === 0) {
            alert("Ingrese al menos una cantidad a recibir.");
            return;
        }

        try {
            await apiClient.post(`/compras/ordenes/${orden.id}/recibir/`, {
                items,
                folio_remision: folioRemision,
                almacen_id: 1,
                notas: "Recepción desde Web UI"
            });
            setSuccess(`Recepción exitosa para OC ${orden.folio}`);
            setOrden(null); // Limpiar pantalla
            setFolio('');
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.detail || 'Error procesando la recepción.');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Package className="text-blue-600" /> Recepción de Almacén
            </h1>

            {/* Buscador */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex gap-4 items-center">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Buscar Orden de Compra</label>
                    <div className="flex gap-2">
                        <input
                            className="border p-2 rounded w-full dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Escanear Folio OC (ej: OC-2026-0001)..."
                            value={folio}
                            onChange={e => setFolio(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && buscarOrden()}
                        />
                        <button onClick={buscarOrden} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded font-medium transition-colors">
                            <Search size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div>{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2"><CheckCircle size={20} />{success}</div>}

            {orden && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row justify-between mb-6 pb-6 border-b dark:border-gray-800 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{orden.folio}</h2>
                            <p className="text-gray-500 mt-1">Proveedor: <span className="font-medium text-gray-700 dark:text-gray-300">{orden.proveedor_nombre || orden.proveedor}</span></p>
                            <p className="text-sm text-gray-400 mt-1">Fecha: {new Date(orden.fecha_creacion).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${orden.estado === 'COMPLETADA' ? 'bg-green-100 text-green-700 border-green-200' :
                                    orden.estado === 'PARCIALMENTE_SURTIDA' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                {orden.estado}
                            </span>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Folio Remisión / Factura</label>
                            <input
                                className="border p-2 rounded w-full dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Ref. del proveedor..."
                                value={folioRemision}
                                onChange={e => setFolioRemision(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Almacén Destino</label>
                            <select className="border p-2 rounded w-full dark:bg-gray-800 dark:border-gray-700" disabled>
                                <option>Almacén Principal (Predeterminado)</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg dark:border-gray-700 mb-6">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 font-medium">
                                <tr>
                                    <th className="p-3 text-left">Producto</th>
                                    <th className="p-3 text-right">Solicitado</th>
                                    <th className="p-3 text-right">Ya Recibido</th>
                                    <th className="p-3 text-right text-blue-600">Pendiente</th>
                                    <th className="p-3 text-right w-40 bg-blue-50 dark:bg-blue-900/10 border-l dark:border-gray-700">Recibir Ahora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {orden.detalles.map(d => {
                                    const insumoId = typeof d.insumo === 'object' ? d.insumo.id : d.insumo;
                                    const nombreInsumo = typeof d.insumo === 'object' ? (d.insumo.descripcion || d.insumo.nombre) : ('Producto ' + d.insumo);

                                    const pendiente = parseFloat(d.cantidad) - (parseFloat(d.cantidad_recibida) || 0);
                                    const isComplete = pendiente <= 0.0001;

                                    return (
                                        <tr key={d.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isComplete ? 'opacity-50 bg-gray-50 dark:bg-gray-900' : ''}`}>
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">
                                                {nombreInsumo}
                                                {d.descripcion_personalizada && <div className="text-xs text-gray-400 font-normal">{d.descripcion_personalizada}</div>}
                                            </td>
                                            <td className="p-3 text-right text-gray-500">{parseFloat(d.cantidad)}</td>
                                            <td className="p-3 text-right text-gray-500">{parseFloat(d.cantidad_recibida) || 0}</td>
                                            <td className="p-3 text-right font-bold text-blue-600">{Math.max(0, pendiente).toFixed(2)}</td>
                                            <td className="p-3 border-l dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
                                                {!isComplete ? (
                                                    <input
                                                        type="number"
                                                        className="w-full text-right border border-blue-200 rounded p-1 dark:bg-gray-800 dark:border-blue-900 focus:ring-2 focus:ring-blue-500"
                                                        max={pendiente}
                                                        min="0"
                                                        placeholder={pendiente}
                                                        onChange={(e) => handleCantidadChange(insumoId, e.target.value)}
                                                    />
                                                ) : (
                                                    <div className="text-center text-green-600 font-medium text-xs flex items-center justify-center gap-1">
                                                        <CheckCircle size={12} /> Completado
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-gray-800">
                        <button
                            onClick={confirmarRecepcion}
                            disabled={orden.estado === 'COMPLETADA'}
                            className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all transform hover:scale-[1.02] ${orden.estado === 'COMPLETADA'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            <CheckCircle size={20} /> Confirmar Entrada de Mercancía
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
