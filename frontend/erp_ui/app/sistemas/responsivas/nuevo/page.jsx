'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, User, Search, Plus, Trash2, Printer
} from 'lucide-react';
import { toast } from 'sonner';

import {
    createAsignacion, getActivosDisponibles, getModelosEquipo, getAsignacionPdfUrl
} from '@/services/sistemas';
import { getEmpleados } from '@/services/rrhh';

import { Button } from '@/components/ui/button'; // Standard button
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";

export default function NuevaResponsivaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Selección Empleado
    const [empleado, setEmpleado] = useState(null);
    const [searchEmp, setSearchEmp] = useState('');
    const [empleadosResult, setEmpleadosResult] = useState([]);

    // Items
    const [items, setItems] = useState([]); // { tipo: 'ACTIVO'|'CONSUMIBLE', data: obj, cantidad: 1 }

    // Buscadores Items
    const [showBusquedaActivo, setShowBusquedaActivo] = useState(false);
    const [activosDisponibles, setActivosDisponibles] = useState([]);
    const [modelosConsumibles, setModelosConsumibles] = useState([]);

    // --- Lógica Empleados ---
    useEffect(() => {
        if (searchEmp.length > 2) {
            getEmpleados(1, 5, { search: searchEmp }).then(res => setEmpleadosResult(res.data.results));
        } else {
            setEmpleadosResult([]);
        }
    }, [searchEmp]);

    // --- Lógica Items ---
    const loadDisponibles = async () => {
        try {
            // Cargar Activos Serializados Disponibles
            const resActivos = await getActivosDisponibles();
            setActivosDisponibles(resActivos.data);

            // Cargar Consumibles (Modelos no inventariables)
            const resModelos = await getModelosEquipo(); // Debería filtrar server side
            // Filtro client side rapido para demo
            setModelosConsumibles(resModelos.data.results.filter(m => !m.es_inventariable));
        } catch (error) { console.error(error); }
    };

    const addItem = (tipo, obj, cantidad = 1) => {
        setItems(prev => [...prev, { tipo, data: obj, cantidad }]);
        setShowBusquedaActivo(false);
    };

    const removeItem = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    // --- Guardar ---
    const handleGuardar = async () => {
        if (!empleado) return toast.warning("Selecciona un empleado");
        if (items.length === 0) return toast.warning("Agrega al menos un equipo");

        setLoading(true);
        try {
            const payload = {
                empleado: empleado.id,
                items: items.map(i => ({
                    activo_id: i.tipo === 'ACTIVO' ? i.data.id : null,
                    modelo_id: i.tipo === 'CONSUMIBLE' ? i.data.id : null,
                    cantidad: i.cantidad
                }))
            };

            const { data } = await createAsignacion(payload);
            toast.success("Responsiva creada correctamente");

            // Abrir PDF automáticamente
            window.open(getAsignacionPdfUrl(data.id), '_blank');
            router.push('/sistemas/responsivas');
        } catch (error) {
            toast.error("Error al crear responsiva");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva Responsiva de Equipo</h1>
                <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Panel Izquierdo: Empleado */}
                <div className="col-span-1 space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" /> Datos del Empleado
                        </h2>

                        {!empleado ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar empleado..."
                                    className="pl-9"
                                    value={searchEmp}
                                    onChange={e => setSearchEmp(e.target.value)}
                                />
                                {empleadosResult.length > 0 && (
                                    <div className="absolute top-10 left-0 right-0 bg-white dark:bg-gray-700 border shadow-lg rounded-lg z-10 max-h-48 overflow-y-auto">
                                        {empleadosResult.map(emp => (
                                            <div key={emp.id} onClick={() => { setEmpleado(emp); setSearchEmp(''); }} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                                                {emp.nombre_completo}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 relative">
                                <button onClick={() => setEmpleado(null)} className="absolute top-2 right-2 text-blue-400 hover:text-blue-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <p className="font-bold text-blue-900 dark:text-blue-200">{empleado.nombre_completo}</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">{empleado.puesto?.nombre || 'Sin Puesto'}</p>
                                <p className="text-xs text-blue-500 mt-1">{empleado.departamento?.nombre}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Equipos */}
                <div className="col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Equipos a Asignar
                            </h2>
                            <Button
                                size="sm"
                                onClick={() => { loadDisponibles(); setShowBusquedaActivo(true); }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Equipo
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                                <Plus className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>No hay equipos seleccionados aún</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800">
                                        <div className="flex items-center gap-3">
                                            {item.tipo === 'ACTIVO'
                                                ? <Badge variant="outline">ACTIVO</Badge>
                                                : <Badge variant="secondary">CONSUMIBLE</Badge>
                                            }
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {item.tipo === 'ACTIVO' ? item.data.modelo_nombre : item.data.nombre}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.tipo === 'ACTIVO' ? `S/N: ${item.data.numero_serie}` : `Cant: ${item.cantidad}`}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    size="lg"
                    onClick={handleGuardar}
                    disabled={loading}
                    className="shadow-xl shadow-indigo-500/20"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    {loading ? 'Generando...' : 'Guardar y Generar PDF'}
                </Button>
            </div>

            {/* Modal Selección Equipo */}
            <Dialog open={showBusquedaActivo} onOpenChange={setShowBusquedaActivo}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Equipo Disponible</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-80 overflow-y-auto p-1">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 sticky top-0 bg-white dark:bg-gray-800 py-1">Activos (con Serie)</h3>
                            {activosDisponibles.length === 0 && <p className="text-xs text-gray-400">No hay activos disponibles.</p>}
                            {activosDisponibles.map(a => (
                                <div
                                    key={a.id}
                                    onClick={() => addItem('ACTIVO', a)}
                                    className="p-2 border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm"
                                >
                                    <p className="font-medium">{a.modelo_nombre}</p>
                                    <p className="text-xs text-gray-500">{a.numero_serie}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 border-l pl-4">
                            <h3 className="text-sm font-semibold text-gray-500 sticky top-0 bg-white dark:bg-gray-800 py-1">Consumibles / Cables</h3>
                            {modelosConsumibles.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => addItem('CONSUMIBLE', m, 1)}
                                    className="p-2 border rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm"
                                >
                                    <p className="font-medium">{m.nombre}</p>
                                    <p className="text-xs text-gray-500">Stock: {m.stock_actual_consumible}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
