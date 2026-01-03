'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Truck, ArrowRight, AlertTriangle } from 'lucide-react';
import requisicionesService from '@/services/requisiciones.service';

// Componente simple para buscar proveedor (dummy por brevedad)
const ProveedorSearch = ({ onSelect }) => {
    // Aquí iría un combobox async.
    // Simulamos selección dummy basada en los proveedores del seed
    return (
        <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col gap-2">
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Seleccionar Proveedor</span>
            <select onChange={(e) => onSelect(e.target.value)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                <option value="">-- Seleccionar --</option>
                <option value="1">Proveedor 1 (ID: 1)</option>
                <option value="2">Proveedor 2 (ID: 2)</option>
            </select>
            <p className="text-xs text-gray-500">Nota: Asegúrate de seleccionar un proveedor que exista en la BD (ID 1 suele existir).</p>
        </div>
    );
};

export default function MesaControlPage() {
    const [pendientes, setPendientes] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [itemsPrices, setItemsPrices] = useState([]);
    const [proveedorId, setProveedorId] = useState('');
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        requisicionesService.getRequisiciones({ estado: 'APROBADA' })
            .then((data) => {
                const list = Array.isArray(data) ? data : (data.results || []);
                setPendientes(list);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelectReq = (req) => {
        setSelectedReq(req);
        // Inicializar precios con los estimados
        setItemsPrices(req.detalles.map(d => ({
            producto_id: d.producto, // ID del insumo
            producto_texto: d.producto_texto || d.producto_nombre,
            cantidad: d.cantidad,
            precio_unitario: d.costo_estimado_unitario,
            original_detail: d
        })));
    };

    const handlePriceChange = (index, val) => {
        const newPrices = [...itemsPrices];
        newPrices[index].precio_unitario = val;
        setItemsPrices(newPrices);
    };

    const handleGenerarOC = async () => {
        if (!proveedorId) return alert("Seleccione Proveedor");

        try {
            await requisicionesService.convertirToOC(selectedReq.id, {
                proveedor_id: proveedorId,
                items: itemsPrices
            });
            alert("Orden de Compra Generada Exitosamente");
            setSelectedReq(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error: " + (e.response?.data?.detail || JSON.stringify(e.response?.data)));
        }
    };

    if (loading && !selectedReq) return <div className="p-8 text-center">Cargando mesa de control...</div>;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Truck className="text-blue-600" />
                Mesa de Control de Abastecimiento
            </h1>

            {!selectedReq ? (
                // Lista
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="p-4 border-b dark:border-gray-800 font-medium text-gray-700 dark:text-gray-200">Requisiciones Aprobadas (Pendientes de Compra)</div>
                    {pendientes.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <CheckCircle size={48} className="text-green-500 mb-4 opacity-50" />
                            <p>Todo al día. No hay requisiciones pendientes de compra.</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-gray-800">
                            {pendientes.map(req => (
                                <div key={req.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            #{req.id}
                                            <span className="text-sm font-normal text-gray-500">| Obra: {req.obra_nombre}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Solicitante: {req.usuario_nombre} <span className="mx-2">•</span> Fecha: {new Date(req.fecha_solicitud).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs font-semibold text-blue-600 mt-2 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-1 rounded">
                                            {req.detalles.length} partidas
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectReq(req)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
                                    >
                                        Procesar Compra <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Procesamiento
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generar Orden de Compra</h2>
                            <p className="text-sm text-gray-500">Procesando Requisición #{selectedReq.id}</p>
                        </div>
                        <button onClick={() => setSelectedReq(null)} className="text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 rounded-md text-sm">Cancelar</button>
                    </div>

                    <div className="space-y-6">
                        <ProveedorSearch onSelect={setProveedorId} />

                        <div>
                            <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Ajuste de Precios y Cantidades Finales</h3>
                            <div className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-3 text-left">Producto</th>
                                            <th className="p-3 text-right">Cant.</th>
                                            <th className="p-3 text-right">Precio Est.</th>
                                            <th className="p-3 text-right text-blue-600">Precio Final (Unitario)</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {itemsPrices.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 font-medium text-gray-700 dark:text-gray-300">{item.producto_texto}</td>
                                                <td className="p-3 text-right text-gray-500">{item.cantidad}</td>
                                                <td className="p-3 text-right text-gray-400">${parseFloat(item.original_detail.costo_estimado_unitario).toFixed(2)}</td>
                                                <td className="p-3 flex justify-end">
                                                    <input
                                                        type="number"
                                                        className="w-32 text-right p-1 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                                        value={item.precio_unitario}
                                                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                                                    ${(item.cantidad * item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={handleGenerarOC}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all transform hover:scale-[1.02]"
                            >
                                <CheckCircle size={20} />
                                Confirmar y Generar OC
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
