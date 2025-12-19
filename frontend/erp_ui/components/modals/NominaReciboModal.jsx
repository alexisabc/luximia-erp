import React, { useState, useEffect } from 'react';
import {
    X, Plus, RefreshCw, Trash2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    updateRecibo, recalcularRecibo,
    addConceptoRecibo, deleteConceptoRecibo, getConceptos
} from '@/services/rrhh';
import { toast } from 'sonner';

export default function NominaReciboModal({ recibo, isOpen, onClose, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [diasPagados, setDiasPagados] = useState(0);
    const [conceptos, setConceptos] = useState([]);

    // Add Concept State
    const [newConceptoId, setNewConceptoId] = useState('');
    const [newMonto, setNewMonto] = useState('');

    useEffect(() => {
        if (recibo) {
            setDiasPagados(recibo.dias_pagados);
        }
        // Fetch concepts catalog
        getConceptos({ page_size: 1000 }).then(res => setConceptos(res.data.results || res.data || []));
    }, [recibo]);

    if (!isOpen || !recibo) return null;

    const handleRecalcular = async () => {
        setLoading(true);
        try {
            // First update header if changed, then recalc
            // Actually recalcular accepts dias_pagados
            await recalcularRecibo(recibo.id, { dias_pagados: diasPagados });
            toast.success("Recibo recalculado");
            onUpdate(); // Parent refresh
            onClose();
        } catch (error) {
            toast.error("Error al recalcular");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateHeader = async () => {
        // Just Save header without recalc (if we want manual override of days but NOT re-run engine? 
        // Engine uses days to calc sueldo. If we change days we MUST recalc sueldo usually.
        // Let's assume Update Header = Recalculate is the safest for MVP.)
        handleRecalcular();
    };

    const handleAddConcepto = async () => {
        if (!newConceptoId || !newMonto) return;
        setLoading(true);
        try {
            await addConceptoRecibo(recibo.id, {
                concepto_id: newConceptoId,
                monto: parseFloat(newMonto)
            });
            toast.success("Concepto agregado");
            setNewConceptoId('');
            setNewMonto('');
            onUpdate(); // Just refresh data? Or we need to refresh THIS modal's data.
            // Problem: reciept prop is stale. We rely on parent re-rendering us or we fetch fresh receipt here?
            // "onUpdate" implies parent refetches and passes down new prop.
        } catch (e) {
            toast.error("Error agregando concepto");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConcepto = async (itemId) => {
        if (!confirm("Eliminar concepto?")) return;
        setLoading(true);
        try {
            await deleteConceptoRecibo(recibo.id, itemId);
            toast.success("Eliminado");
            onUpdate();
        } catch (e) {
            toast.error("Error eliminando");
        } finally {
            setLoading(false);
        }
    };

    const percepciones = recibo.detalles.filter(d => d.concepto_codigo.startsWith('P') || d.concepto_codigo.startsWith('0'));
    // Heuristic: backend sends 'P' or 'D'? Or check serializer? 
    // Serializer sends full 'concepto' object? No, 'concepto' ID and 'concepto_codigo'.
    // Wait, serializer DetalleReciboItemSerializer sends: 'concepto' (ID), 'concepto_codigo', 'nombre_concepto'.
    // We don't have 'tipo' here unless we fetch it or heuristic.
    // Backend 'concepto_codigo' is e.g. '001'.
    // We need to know if it is Perception or Deduction.
    // Let's optimize: fetch concepts list has types. We can map.

    const getConceptoTipo = (id) => {
        const c = conceptos.find(x => x.id === id);
        return c?.tipo || 'Desconocido';
    }

    // Actually, backend calculates totals. We can just list them all or split if possible.
    // Let's list simply for MVP, or try to split by known list.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Editar Recibo: {recibo.empleado_nombre}</h2>
                        <p className="text-sm text-gray-500">Folio: {recibo.id}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500">
                        <X />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* General Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Días a Pagar</label>
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2"
                                value={diasPagados}
                                onChange={e => setDiasPagados(e.target.value)}
                            />
                        </div>
                        <div>
                            <Button onClick={handleRecalcular} disabled={loading} className="w-full gap-2">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Guardar y Recalcular
                            </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                            * Al recalcular se borrarán ajustes manuales no guardados en conceptos automáticos.
                        </div>
                    </div>

                    {/* Conceptos Table */}
                    <div>
                        <h3 className="font-semibold mb-3 dark:text-gray-200">Detalle de Conceptos</h3>
                        <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="p-3">Concepto</th>
                                        <th className="p-3 text-right">Gravado</th>
                                        <th className="p-3 text-right">Exento</th>
                                        <th className="p-3 text-right">Total</th>
                                        <th className="p-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recibo.detalles.map(item => (
                                        <tr key={item.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                            <td className="p-3">
                                                <span className="font-medium">{item.nombre_concepto}</span>
                                                <span className="block text-xs text-gray-400">{item.concepto_codigo}</span>
                                            </td>
                                            <td className="p-3 text-right text-gray-500">${parseFloat(item.monto_gravado).toFixed(2)}</td>
                                            <td className="p-3 text-right text-gray-500">${parseFloat(item.monto_exento).toFixed(2)}</td>
                                            <td className="p-3 text-right font-medium dark:text-white">${parseFloat(item.monto_total).toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleDeleteConcepto(item.id)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {recibo.detalles.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-4 text-center text-gray-500">Sin conceptos calculados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Concept */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-sm mb-3 dark:text-gray-300">Agregar Concepto Manual</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                                value={newConceptoId}
                                onChange={e => setNewConceptoId(e.target.value)}
                            >
                                <option value="">Seleccionar Concepto...</option>
                                <optgroup label="Percepciones">
                                    {conceptos.filter(c => c.tipo === 'PERCEPCION').map(c => (
                                        <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Deducciones">
                                    {conceptos.filter(c => c.tipo === 'DEDUCCION').map(c => (
                                        <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Otros Pagos">
                                    {conceptos.filter(c => c.tipo === 'OTRO_PAGO').map(c => (
                                        <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <input
                                type="number"
                                placeholder="Monto"
                                className="w-32 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                                value={newMonto}
                                onChange={e => setNewMonto(e.target.value)}
                            />
                            <Button onClick={handleAddConcepto} disabled={!newConceptoId || !newMonto || loading} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
}
