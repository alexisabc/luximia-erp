'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, User, Search, Plus, Trash2, Printer,
    ChevronLeft, Monitor, Package, Check, X,
    ChevronRight, HardDrive, Cpu, ShoppingBag,
    Sparkles, ShieldCheck, ArrowRight, UserCheck,
    ClipboardList, Info
} from 'lucide-react';
import { toast } from 'sonner';

import {
    createAsignacion, getActivosDisponibles, getModelosEquipo, getAsignacionPdfUrl
} from '@/services/sistemas';
import { getEmpleados } from '@/services/rrhh';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function NuevaResponsivaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Selección Empleado
    const [empleado, setEmpleado] = useState(null);
    const [searchEmp, setSearchEmp] = useState('');
    const [empleadosResult, setEmpleadosResult] = useState([]);
    const [isSearchingEmp, setIsSearchingEmp] = useState(false);

    // Items seleccionados
    const [items, setItems] = useState([]); // { tipo: 'ACTIVO'|'CONSUMIBLE', data: obj, cantidad: 1 }

    // Modal Selección Items
    const [showBusquedaActivo, setShowBusquedaActivo] = useState(false);
    const [activosDisponibles, setActivosDisponibles] = useState([]);
    const [modelosConsumibles, setModelosConsumibles] = useState([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' | 'consumibles'

    // --- Lógica Empleados ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchEmp.length > 2) {
                setIsSearchingEmp(true);
                try {
                    const res = await getEmpleados(1, 5, { search: searchEmp });
                    setEmpleadosResult(res.data.results);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsSearchingEmp(false);
                }
            } else {
                setEmpleadosResult([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchEmp]);

    // --- Lógica Items ---
    const loadDisponibles = async () => {
        setIsLoadingItems(true);
        try {
            const [resActivos, resModelos] = await Promise.all([
                getActivosDisponibles(),
                getModelosEquipo()
            ]);
            setActivosDisponibles(resActivos.data);
            setModelosConsumibles(resModelos.data.results?.filter(m => !m.es_inventariable) || []);
        } catch (error) {
            toast.error("No se pudieron cargar los equipos disponibles");
            console.error(error);
        } finally {
            setIsLoadingItems(false);
        }
    };

    const addItem = (tipo, obj, cantidad = 1) => {
        // Evitar duplicados de activos serializados
        if (tipo === 'ACTIVO' && items.some(i => i.tipo === 'ACTIVO' && i.data.id === obj.id)) {
            return toast.warning("Este equipo ya está en la lista");
        }

        setItems(prev => [...prev, { tipo, data: obj, cantidad }]);
        setShowBusquedaActivo(false);
        toast.success(`${tipo === 'ACTIVO' ? 'Equipo' : 'Insumo'} agregado a la lista`);
    };

    const removeItem = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleGuardar = async () => {
        if (!empleado) return toast.error("Debe seleccionar un empleado beneficiario");
        if (items.length === 0) return toast.error("Debe agregar al menos un equipo o insumo");

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
            toast.success("Asignación registrada y responsiva generada");

            // Abrir PDF automáticamente
            window.open(getAsignacionPdfUrl(data.id), '_blank');
            router.push('/sistemas/responsivas');
        } catch (error) {
            toast.error("Error al procesar la responsiva");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full pb-16 animate-in fade-in duration-700 ease-out">
            {/* Header / Banner Premium */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/60 sticky top-0 z-30 transition-all duration-300">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => router.back()}
                            className="group p-3 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg dark:shadow-none border border-gray-100 dark:border-gray-800 rounded-2xl transition-all duration-300 hover:-translate-x-1"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                                <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
                                    Generar Responsiva TI
                                </h1>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Asigna recursos tecnológicos con validez administrativa.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            onClick={handleGuardar}
                            disabled={loading || !empleado || items.length === 0}
                            className={`relative overflow-hidden px-8 h-14 rounded-2xl font-bold shadow-2xl transition-all duration-500 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 ${loading || !empleado || items.length === 0
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-100 dark:border-gray-800 shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-600/30 dark:shadow-blue-900/20'
                                }`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-gray-400 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Printer className="w-5 h-5" />
                                    <span>Generar e Imprimir</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Paso 1: Beneficiario (Col: 5) */}
                <div className="lg:col-span-5 space-y-8">
                    <section className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden transition-all duration-500 hover:shadow-2xl">
                        <div className="p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-inner">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Personal Beneficiario</h2>
                                    <p className="text-xs text-gray-500 font-medium">Identificación del receptor del equipo</p>
                                </div>
                            </div>

                            {!empleado ? (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                                        {isSearchingEmp ? (
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        )}
                                    </div>
                                    <Input
                                        placeholder="Buscar por nombre o número..."
                                        className="pl-12 h-14 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border-none text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        value={searchEmp}
                                        onChange={e => setSearchEmp(e.target.value)}
                                    />

                                    {empleadosResult.length > 0 && (
                                        <div className="absolute mt-3 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-2xl rounded-[1.5rem] z-40 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800 animate-in slide-in-from-top-2 duration-300">
                                            {empleadosResult.map(emp => (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => { setEmpleado(emp); setSearchEmp(''); setEmpleadosResult([]); }}
                                                    className="w-full p-5 flex items-center gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{emp.nombre_completo}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate tracking-wide uppercase font-semibold">{emp.puesto?.nombre || 'General'}</p>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="relative bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/10 dark:to-blue-900/10 border border-indigo-100/50 dark:border-indigo-800/50 rounded-3xl p-6 group animate-in zoom-in-95 duration-500">
                                    <button
                                        onClick={() => setEmpleado(null)}
                                        className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                        title="Cambiar receptor"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-20 h-20 rounded-[1.25rem] bg-white dark:bg-gray-800 shadow-xl shadow-indigo-200/30 dark:shadow-none border border-indigo-50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-500">
                                            <User className="w-10 h-10" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xl font-extrabold text-indigo-950 dark:text-white truncate mb-1">{empleado.nombre_completo}</p>
                                            <Badge variant="outline" className="px-3 py-0.5 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-[10px] uppercase tracking-wider">
                                                {empleado.puesto?.nombre || 'Empleado'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/40 rounded-2xl border border-white/80 dark:border-gray-700/30">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Departamento</span>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{empleado.departamento?.nombre || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/40 rounded-2xl border border-white/80 dark:border-gray-700/30">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">ID Empleado</span>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">#INF-{empleado.id || '00'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-[2rem] p-6 flex gap-4">
                        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed font-semibold italic">
                            Asegúrate de verificar la identidad del beneficiario antes de proceder. La firma digital o física será requerida tras la impresión.
                        </p>
                    </div>
                </div>

                {/* Paso 2: Items (Col: 7) */}
                <div className="lg:col-span-7 space-y-8 h-full">
                    <section className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none min-h-[500px] flex flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl">
                        <div className="p-8 pb-6 flex justify-between items-center bg-white/50 dark:bg-transparent border-b border-gray-100 dark:border-gray-800/60">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-inner">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Detalle de Entrega</h2>
                                    <p className="text-xs text-gray-500 font-medium">Equipos e insumos a resguardar</p>
                                </div>
                            </div>
                            <Button
                                disabled={!empleado}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] px-6 h-12 transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-95"
                                onClick={() => { loadDisponibles(); setShowBusquedaActivo(true); }}
                            >
                                <Plus className="w-5 h-5 mr-1" />
                                Añadir Item
                            </Button>
                        </div>

                        <div className="flex-1 p-8">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-6 bg-gray-50/50 dark:bg-gray-800/20 rounded-[2.5rem] border-4 border-dashed border-gray-200/60 dark:border-gray-800/60 group hover:border-blue-200/50 dark:hover:border-blue-900/30 transition-all duration-500">
                                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-2xl flex items-center justify-center mb-6 text-gray-200 group-hover:text-blue-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                                        <Package className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white text-lg font-black mb-2 opacity-60">CATÁLOGO DE ENTREGA VACÍO</h3>
                                    <p className="text-sm text-gray-500 max-w-[280px] font-medium leading-relaxed">
                                        Inicia la asignación seleccionando equipos activos o insumos disponibles del inventario central.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="group flex items-center gap-5 p-5 border border-gray-100 dark:border-gray-800/80 rounded-[1.75rem] bg-white/80 dark:bg-gray-800/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-500 animate-in slide-in-from-right-8 fade-in">
                                                <div className={`p-4 rounded-2xl shadow-inner ${item.tipo === 'ACTIVO'
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                    }`}>
                                                    {item.tipo === 'ACTIVO' ? <Monitor className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <p className="font-exrabold text-gray-900 dark:text-white truncate text-base tracking-tight">
                                                            {item.tipo === 'ACTIVO' ? item.data.modelo_nombre : item.data.nombre}
                                                        </p>
                                                        <Badge className={`border-none text-[9px] font-black tracking-tighter px-2 h-5 flex items-center ${item.tipo === 'ACTIVO'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                                            }`}>
                                                            {item.tipo === 'ACTIVO' ? 'HARDWARE' : 'CONSUMIBLE'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 tracking-wide font-mono uppercase">
                                                        {item.tipo === 'ACTIVO' ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Hash className="w-3 h-3 text-blue-500" />
                                                                <span>SERIE: <span className="text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 rounded-md ml-1">{item.data.numero_serie}</span></span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <Plus className="w-3 h-3 text-emerald-500" />
                                                                <span>CANTIDAD: <span className="text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 rounded-md ml-1">{item.cantidad}</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-2xl transition-all opacity-0 group-hover:opacity-100 hover:rotate-12 active:scale-90"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 font-black text-sm w-10 h-10 flex items-center justify-center">
                                                {items.length}
                                            </div>
                                            <p className="text-gray-500 font-bold text-sm tracking-tight">Items en la lista de resguardo</p>
                                        </div>
                                        <button
                                            onClick={() => setItems([])}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            Limpiar Todo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Modal Selección Equipo - Rediseño Total */}
            <Dialog open={showBusquedaActivo} onOpenChange={setShowBusquedaActivo}>
                <DialogContent className="max-w-3xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-none shadow-[0_0_100px_rgba(0,0,0,0.2)] dark:shadow-[0_0_100px_rgba(0,0,0,0.6)] p-0 overflow-hidden rounded-[3rem] animate-in zoom-in-95 duration-500">
                    <DialogHeader className="p-10 pb-6">
                        <DialogTitle className="text-3xl font-black flex items-center gap-4 tracking-tighter">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl text-white shadow-xl shadow-blue-500/30">
                                <Plus className="w-8 h-8" />
                            </div>
                            EXPLORAR INVENTARIO
                        </DialogTitle>
                        <DialogDescription className="text-lg text-gray-500 font-bold ml-16 -mt-2">
                            Selecciona recursos disponibles para {empleado?.nombre_completo.split(' ')[0]}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tabs Premium */}
                    <div className="px-10 flex gap-10 border-b border-gray-100 dark:border-gray-800 ml-16 mr-10">
                        <button
                            onClick={() => setActiveTab('activos')}
                            className={`pb-5 text-base font-black transition-all relative ${activeTab === 'activos' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className="flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                Hardware Activo
                            </span>
                            {activeTab === 'activos' && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-600 rounded-full animate-in slide-in-from-left-4" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('consumibles')}
                            className={`pb-5 text-base font-black transition-all relative ${activeTab === 'consumibles' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                Insumos (No Serializados)
                            </span>
                            {activeTab === 'consumibles' && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-600 rounded-full animate-in slide-in-from-right-4" />}
                        </button>
                    </div>

                    <div className="p-10 max-h-[55vh] overflow-y-auto custom-scrollbar-thin bg-gray-50/20 dark:bg-transparent">
                        {isLoadingItems ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-6">
                                <div className="relative">
                                    <div className="w-20 h-20 border-8 border-blue-500/20 rounded-full" />
                                    <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0" />
                                </div>
                                <p className="text-xl text-gray-400 font-black tracking-widest uppercase">Consultando Inventario...</p>
                            </div>
                        ) : activeTab === 'activos' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activosDisponibles.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-gray-100/50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-black italic">
                                        NO SE ENCONTRARON EQUIPOS ACTIVOS SIN ASIGNACIÓN
                                    </div>
                                ) : activosDisponibles.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => addItem('ACTIVO', a)}
                                        className="group p-6 border border-gray-100 dark:border-gray-800/80 rounded-[2rem] bg-white dark:bg-gray-900 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-500 text-left flex flex-col gap-4 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2 bg-blue-600 text-white transform translate-x-full group-hover:translate-x-0 transition-all duration-500 rounded-bl-xl">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                <HardDrive className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-gray-900 dark:text-gray-100 truncate text-lg tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors uppercase">{a.modelo_nombre}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono font-bold text-gray-400 group-hover:text-gray-500 transition-colors tracking-widest uppercase">SERIE: {a.numero_serie}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <Badge className="bg-blue-100/50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-none text-[9px] px-3 py-1 font-black uppercase tracking-widest rounded-lg">
                                                {a.categoria_nombre || 'GENERAL'}
                                            </Badge>
                                            {a.etiqueta_interno && (
                                                <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 border-none font-mono text-[9px] px-3 font-bold rounded-lg uppercase">
                                                    Tag: {a.etiqueta_interno}
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {modelosConsumibles.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-gray-100/50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-black italic">
                                        NO SE ENCONTRARON MODELOS MARCADOS COMO CONSUMIBLES CON STOCK
                                    </div>
                                ) : modelosConsumibles.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => addItem('CONSUMIBLE', m, 1)}
                                        className="group p-6 border border-gray-100 dark:border-gray-800/80 rounded-[2rem] bg-white dark:bg-gray-900 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all duration-500 text-left flex flex-col gap-4 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2 bg-emerald-600 text-white transform translate-x-full group-hover:translate-x-0 transition-all duration-500 rounded-bl-xl">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                <Cpu className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-gray-900 dark:text-gray-100 truncate text-lg tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors uppercase">{m.nombre}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono font-bold text-gray-400 group-hover:text-gray-500 transition-colors tracking-widest">STOCK: <span className="text-emerald-600 font-black">{m.stock_actual_consumible} DISP.</span></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <Badge className="bg-emerald-100/50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-none text-[9px] px-3 py-1 font-black uppercase tracking-widest rounded-lg">
                                                ID: {m.id}
                                            </Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-10 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
                        <p className="text-sm text-gray-400 italic font-bold max-w-[400px]">Selecciona los elementos que el colaborador recibirá formalmente. Se añadirán a la lista de inmediato.</p>
                        <Button
                            variant="ghost"
                            className="rounded-2xl font-black h-12 px-8 uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                            onClick={() => setShowBusquedaActivo(false)}
                        >
                            Cerrar Catálogo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
