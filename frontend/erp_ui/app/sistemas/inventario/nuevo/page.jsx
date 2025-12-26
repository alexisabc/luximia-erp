'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Monitor, Save, Info, ChevronLeft,
    Hash, Tag, MapPin, Calendar, Truck,
    FileText, DollarSign, MessageSquare,
    Package, Sparkles, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

import { createActivoIT, getModelosEquipo } from '@/services/sistemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function NuevoActivoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [modelos, setModelos] = useState([]);
    const [searchingModelos, setSearchingModelos] = useState(false);

    const [formData, setFormData] = useState({
        modelo: '',
        numero_serie: '',
        etiqueta_interno: '',
        estado: 'DISPONIBLE',
        ubicacion: '',
        fecha_compra: '',
        proveedor: '',
        factura_compra: '',
        costo: '',
        observaciones: ''
    });

    useEffect(() => {
        const fetchModelos = async () => {
            setSearchingModelos(true);
            try {
                const { data } = await getModelosEquipo();
                setModelos(data.results || []);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar modelos");
            } finally {
                setSearchingModelos(false);
            }
        };
        fetchModelos();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createActivoIT(formData);
            toast.success("Activo registrado con éxito");
            router.push('/sistemas/inventario');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Error al crear el activo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
            {/* Header Moderno con Gradiente */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => router.back()}
                        className="group p-3 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg dark:shadow-none border border-gray-100 dark:border-gray-800 rounded-2xl transition-all duration-300 hover:-translate-x-1"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
                                Nuevo Activo de Sistemas
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            Integra tecnología de vanguardia al inventario del grupo.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-4 py-1.5 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold rounded-xl flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Registro Protegido
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Columna Principal (8/12) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Sección 1: Identificación */}
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl dark:hover:border-gray-700">
                        <div className="p-7 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                                <Package className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Especificaciones del Hardware</h2>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Modelo Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Modelo del Equipo</label>
                                <div className="relative group">
                                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                                    <select
                                        name="modelo"
                                        required
                                        value={formData.modelo}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50/80 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/50 dark:focus:border-blue-400/50 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Selecciona un modelo verificado...</option>
                                        {modelos.map(m => (
                                            <option key={m.id} value={m.id}>{m.nombre} (Cat: {m.categoria_nombre})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronLeft className="w-4 h-4 text-gray-400 -rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Hash className="w-3.5 h-3.5" /> Número de Serie
                                    </label>
                                    <Input
                                        name="numero_serie"
                                        required
                                        placeholder="Ej: S/N-XXXXXXXX"
                                        value={formData.numero_serie}
                                        onChange={handleChange}
                                        className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all px-5"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5" /> Asset Tag (Interno)
                                    </label>
                                    <Input
                                        name="etiqueta_interno"
                                        placeholder="Ej: LUX-IT-100"
                                        value={formData.etiqueta_interno}
                                        onChange={handleChange}
                                        className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all px-5"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Adquisición */}
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl dark:hover:border-gray-700 overflow-hidden">
                        <div className="p-7 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-900/10 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Ciclo de Inversión</h2>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Fecha de Adquisición
                                </label>
                                <Input
                                    name="fecha_compra"
                                    type="date"
                                    value={formData.fecha_compra}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5" /> Costo Neto (MXN)
                                </label>
                                <Input
                                    name="costo"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.costo}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5" /> Socio Comercial / Proveedor
                                </label>
                                <Input
                                    name="proveedor"
                                    placeholder="Nombre del proveedor"
                                    value={formData.proveedor}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Referencia de Factura
                                </label>
                                <Input
                                    name="factura_compra"
                                    placeholder="No. de documento"
                                    value={formData.factura_compra}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Lateral (4/12) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Control de Estado y Ubicación */}
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 space-y-8 animate-in slide-in-from-right-10 duration-700">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" /> Ubicación Logística
                            </label>
                            <Input
                                name="ubicacion"
                                placeholder="Ej: Corporativo Cancún"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5"
                            />
                        </div>

                        <div className="space-y-5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Estatus del Activo</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'DISPONIBLE', color: 'blue', label: 'Disponible' },
                                    { id: 'MANTENIMIENTO', color: 'amber', label: 'En Mantenimiento' },
                                    { id: 'BAJA', color: 'red', label: 'Baja Definitiva' },
                                    { id: 'GARANTIA', color: 'indigo', label: 'En Garantía' }
                                ].map(est => (
                                    <button
                                        key={est.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, estado: est.id }))}
                                        className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border ${formData.estado === est.id
                                                ? `bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/40 scale-[1.02]`
                                                : 'bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <span>{est.label}</span>
                                        {formData.estado === est.id && (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-sm shadow-white/50" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" /> Bitácora / Observaciones
                            </label>
                            <textarea
                                name="observaciones"
                                rows={5}
                                placeholder="Descripción técnica del estado del activo..."
                                value={formData.observaciones}
                                onChange={handleChange}
                                className="w-full bg-gray-50/80 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 dark:focus:border-blue-400/30 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="p-1 space-y-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-full relative overflow-hidden h-16 rounded-2xl font-bold shadow-2xl transition-all duration-500 hover:-translate-y-1.5 active:scale-95 flex items-center justify-center gap-3 ${loading
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-100 dark:border-gray-800 shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-600/30 dark:shadow-blue-900/20'
                                }`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    <span className="text-base tracking-wide uppercase">Finalizar Registro</span>
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="w-full h-14 rounded-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300"
                        >
                            Descartar y Regresar
                        </Button>
                    </div>

                    {/* Nota Informativa */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-[2.5rem] p-7 flex gap-5 shadow-sm">
                        <div className="mt-1 flex-shrink-0">
                            <div className="p-2 bg-indigo-100/80 dark:bg-indigo-900/40 rounded-full">
                                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed font-semibold">
                            Al registrar este activo como <span className="text-indigo-900 dark:text-indigo-200 uppercase font-extrabold">Disponible</span>, se habilitará automáticamente para su asignación en el módulo de <span className="underline decoration-indigo-300 dark:decoration-indigo-700 underline-offset-4">Responsivas</span>.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
