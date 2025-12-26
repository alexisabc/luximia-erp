'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Monitor, Save, Info, ChevronLeft,
    Hash, Tag, MapPin, Calendar, Truck,
    FileText, DollarSign, MessageSquare, Trash2,
    Sparkles, ShieldCheck, Package
} from 'lucide-react';
import { toast } from 'sonner';

import { getActivoIT, updateActivoIT, deleteActivoIT, getModelosEquipo } from '@/services/sistemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ConfirmationModal from '@/components/modals/Confirmation';

export default function EditarActivoPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [modelos, setModelos] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        const loadData = async () => {
            setFetching(true);
            try {
                const [assetRes, modelsRes] = await Promise.all([
                    getActivoIT(id),
                    getModelosEquipo()
                ]);

                const asset = assetRes.data;
                setFormData({
                    modelo: asset.modelo || '',
                    numero_serie: asset.numero_serie || '',
                    etiqueta_interno: asset.etiqueta_interno || '',
                    estado: asset.estado || 'DISPONIBLE',
                    ubicacion: asset.ubicacion || '',
                    fecha_compra: asset.fecha_compra || '',
                    proveedor: asset.proveedor || '',
                    factura_compra: asset.factura_compra || '',
                    costo: asset.costo || '',
                    observaciones: asset.observaciones || ''
                });
                setModelos(modelsRes.data.results || []);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar los datos del activo");
                router.push('/sistemas/inventario');
            } finally {
                setFetching(false);
            }
        };
        loadData();
    }, [id, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateActivoIT(id, formData);
            toast.success("Activo tecnológico actualizado");
            router.push('/sistemas/inventario');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Error al actualizar el activo");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteActivoIT(id);
            toast.success("Activo removido del inventario activo");
            router.push('/sistemas/inventario');
        } catch (error) {
            toast.error("No se pudo desactivar el activo");
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0" />
                </div>
                <p className="text-gray-400 font-black tracking-widest uppercase text-xs animate-pulse">Sincronizando con Servidor...</p>
            </div>
        );
    }

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
                                Editar Recurso TI
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            Gestión técnica del activo <span className="text-blue-600 dark:text-blue-400 font-bold">#ASSET-{id}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-4 py-1.5 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold rounded-xl flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Edición Autorizada
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Columna Principal (8/12) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Sección 1: Identificación */}
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl dark:hover:border-gray-700">
                        <div className="p-7 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shadow-inner">
                                <Package className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Especificaciones de Hardware</h2>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Modelo Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Modelo de Referencia</label>
                                <div className="relative group">
                                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                                    <select
                                        name="modelo"
                                        required
                                        value={formData.modelo}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50/80 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/50 dark:focus:border-blue-400/50 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Selecciona un modelo...</option>
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
                                        <Hash className="w-3.5 h-3.5 text-blue-500" /> Número de Serie Producido
                                    </label>
                                    <Input
                                        name="numero_serie"
                                        required
                                        placeholder="S/N-XXXXXXXX"
                                        value={formData.numero_serie}
                                        onChange={handleChange}
                                        className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5 text-blue-500" /> Asset Tag (Interno LUX)
                                    </label>
                                    <Input
                                        name="etiqueta_interno"
                                        placeholder="Ej: LUX-IT-000"
                                        value={formData.etiqueta_interno}
                                        onChange={handleChange}
                                        className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Adquisición */}
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl dark:hover:border-gray-700 overflow-hidden">
                        <div className="p-7 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-900/10 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-inner">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Datos de Capitalización</h2>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Fecha de Registro Compra
                                </label>
                                <Input
                                    name="fecha_compra"
                                    type="date"
                                    value={formData.fecha_compra}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Costo Histórico (MXN)
                                </label>
                                <Input
                                    name="costo"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.costo}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5 text-emerald-500" /> Origen / Proveedor
                                </label>
                                <Input
                                    name="proveedor"
                                    placeholder="Proveedor tecnológico"
                                    value={formData.proveedor}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Documento Factura
                                </label>
                                <Input
                                    name="factura_compra"
                                    placeholder="Folio fiscal o interno"
                                    value={formData.factura_compra}
                                    onChange={handleChange}
                                    className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
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
                                <MapPin className="w-3.5 h-3.5 text-blue-500" /> Resguardo Físico
                            </label>
                            <Input
                                name="ubicacion"
                                placeholder="Ej: Site Central, Bodega"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                className="bg-gray-50/80 dark:bg-gray-800/50 border-none h-14 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Estatus del Ciclo de Vida</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'DISPONIBLE', color: 'bg-emerald-600', label: 'Disponible' },
                                    { id: 'ASIGNADO', color: 'bg-blue-600', label: 'Asignado (Solo Lectura)', disabled: true },
                                    { id: 'MANTENIMIENTO', color: 'bg-amber-600', label: 'En Soporte' },
                                    { id: 'GARANTIA', color: 'bg-indigo-600', label: 'Vía Garantía' },
                                    { id: 'BAJA', color: 'bg-red-600', label: 'Baja Definitiva' }
                                ].map(est => (
                                    <button
                                        key={est.id}
                                        type="button"
                                        disabled={est.disabled || (formData.estado === 'ASIGNADO' && est.id !== 'ASIGNADO')}
                                        onClick={() => setFormData(prev => ({ ...prev, estado: est.id }))}
                                        className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black transition-all duration-300 border uppercase tracking-wider ${formData.estado === est.id
                                                ? `${est.color} text-white border-transparent shadow-lg shadow-black/10 scale-[1.02]`
                                                : (est.disabled || (formData.estado === 'ASIGNADO'))
                                                    ? 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed opacity-50'
                                                    : 'bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <span>{est.label}</span>
                                        {formData.estado === est.id && (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {formData.estado === 'ASIGNADO' && (
                                <p className="text-[10px] text-blue-500 font-bold ml-1 italic leading-tight">
                                    * Los activos asignados deben liberarse mediante una devolución para cambiar su estado.
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Bitácora Técnica
                            </label>
                            <textarea
                                name="observaciones"
                                rows={4}
                                placeholder="Anota cualquier cambio relevante en el hardware..."
                                value={formData.observaciones}
                                onChange={handleChange}
                                className="w-full bg-gray-50/80 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none placeholder:text-gray-400/50 shadow-inner"
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
                                    <Save className="w-5 h-5" />
                                    <span className="text-base tracking-wide uppercase">Consolidar Cambios</span>
                                </>
                            )}
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all duration-300"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Retirar
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="h-14 rounded-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-black text-xs uppercase tracking-widest hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="RETIRO DE INVENTARIO"
                message={`¿Confirmas que deseas mover el activo #ASSET-${id} al archivo histórico de inactivos? Esta acción retirará el equipo de la vista operativa.`}
                confirmText="Confirmar Retiro"
            />
        </div>
    );
}
