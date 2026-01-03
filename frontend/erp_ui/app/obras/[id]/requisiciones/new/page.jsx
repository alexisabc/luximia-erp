'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import obrasService from '@/services/obras.service';
import requisicionesService from '@/services/requisiciones.service';

const NewRequisicionPage = () => {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [centrosCostos, setCentrosCostos] = useState([]);
    const [selectedCC, setSelectedCC] = useState('');
    const [items, setItems] = useState([{ producto_texto: '', cantidad: 1, costo_estimado: 0 }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            obrasService.getCentrosCostos(id).then(setCentrosCostos);
        }
    }, [id]);

    const handleAddItem = () => {
        setItems([...items, { producto_texto: '', cantidad: 1, costo_estimado: 0 }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleChangeItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = {
                obra_id: id,
                centro_costo_id: selectedCC,
                detalles: items.map(item => ({
                    producto_texto: item.producto_texto,
                    cantidad: parseFloat(item.cantidad),
                    costo_estimado: parseFloat(item.costo_estimado)
                }))
            };

            await requisicionesService.createRequisicion(data);
            router.push(`/obras/${id}`);
        } catch (err) {
            console.error(err);
            // Capturar mensaje de error del backend (Django DRF usually sends {detail: "..."} or field errors)
            const msg = err.response?.data?.detail
                || err.response?.data?.error
                || (typeof err.response?.data === 'string' ? err.response.data : JSON.stringify(err.response?.data))
                || "Error creando requisición";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar solo hojas para el selector
    const hojasCostos = centrosCostos.filter(cc => cc.es_hoja);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Nueva Requisición de Material</h1>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3 border border-red-200 dark:border-red-800">
                    <AlertCircle size={24} />
                    <div className="font-medium whitespace-pre-wrap">{error}</div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">

                {/* Selector Centro de Costos */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Centro de Costos (Imputación)</label>
                    <select
                        required
                        value={selectedCC}
                        onChange={(e) => setSelectedCC(e.target.value)}
                        className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Selecciona una partida...</option>
                        {hojasCostos.map(cc => (
                            <option key={cc.id} value={cc.id}>
                                {cc.codigo} - {cc.nombre}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Solo se pueden imputar gastos a partidas "Hoja".</p>
                </div>

                {/* Tabla Items */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Materiales Requeridos</label>
                    </div>

                    <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
                                <tr>
                                    <th className="p-3 font-medium text-gray-500 w-1/2">Descripción / Producto</th>
                                    <th className="p-3 font-medium text-gray-500 w-24">Cant.</th>
                                    <th className="p-3 font-medium text-gray-500 w-32">Costo Est.</th>
                                    <th className="p-3 font-medium text-gray-500 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Ej: Cemento Gris 50kg"
                                                className="w-full p-1 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors"
                                                value={item.producto_texto}
                                                onChange={(e) => handleChangeItem(idx, 'producto_texto', e.target.value)}
                                                required
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                min="0.01" step="0.01"
                                                className="w-full p-1 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors text-right"
                                                value={item.cantidad}
                                                onChange={(e) => handleChangeItem(idx, 'cantidad', e.target.value)}
                                                required
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center">
                                                <span className="text-gray-400 mr-1">$</span>
                                                <input
                                                    type="number"
                                                    min="0" step="0.01"
                                                    className="w-full p-1 bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition-colors text-right"
                                                    value={item.costo_estimado}
                                                    onChange={(e) => handleChangeItem(idx, 'costo_estimado', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 text-center">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                    >
                        <Plus size={16} /> Agregar Fila
                    </button>

                    <div className="mt-4 flex justify-end text-lg font-bold">
                        Total Estimado: ${items.reduce((acc, item) => acc + (parseFloat(item.cantidad || 0) * parseFloat(item.costo_estimado || 0)), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Validando Presupuesto...' : (
                            <>
                                <Save size={18} />
                                Enviar Solicitud
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NewRequisicionPage;
