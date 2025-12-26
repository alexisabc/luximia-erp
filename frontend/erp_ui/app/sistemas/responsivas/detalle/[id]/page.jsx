'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    FileText, User, Calendar, Monitor,
    Package, ChevronLeft, Printer, CheckCircle2,
    XCircle, Info, Hash, MapPin, ClipboardCheck,
    Cpu, Laptop, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

import { getAsignacion, getAsignacionPdfUrl } from '@/services/sistemas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DetalleResponsivaPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [asignacion, setAsignacion] = useState(null);

    useEffect(() => {
        const fetchDetalle = async () => {
            try {
                const { data } = await getAsignacion(id);
                setAsignacion(data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar el detalle de la responsiva");
                router.push('/sistemas/inventario');
            } finally {
                setLoading(false);
            }
        };
        fetchDetalle();
    }, [id, router]);

    const handlePrint = () => {
        window.open(getAsignacionPdfUrl(id), '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-600/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0" />
                </div>
                <p className="text-gray-400 font-black tracking-widest uppercase text-xs animate-pulse">Obteniendo Documentación...</p>
            </div>
        );
    }

    if (!asignacion) return null;

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Detalle */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 rounded-2xl transition-all hover:-translate-x-1"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                                Responsiva <span className="text-indigo-600 dark:text-indigo-400">#{asignacion.id}</span>
                            </h1>
                            <Badge variant="outline" className={`px-3 py-1 font-black text-[10px] uppercase tracking-widest ${asignacion.firmada
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30'
                                    : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30'
                                }`}>
                                {asignacion.firmada ? 'Firmada' : 'Pendiente de Firma'}
                            </Badge>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            Emitida el {new Date(asignacion.fecha_asignacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-2xl px-6 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                        <Printer className="w-5 h-5" />
                        Imprimir PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Información del Colaborador */}
                <div className="space-y-8">
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{asignacion.empleado_nombre}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{asignacion.departamento_nombre || 'Departamento no asignado'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm py-3 border-b border-gray-50 dark:border-gray-800">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Puesto</span>
                                <span className="text-gray-700 dark:text-gray-200 font-bold">{asignacion.puesto_nombre || '--'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-3">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Estatus Digital</span>
                                {asignacion.firmada ? (
                                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold"><CheckCircle2 className="w-4 h-4" /> Validado</span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-amber-500 font-bold"><XCircle className="w-4 h-4" /> Pendiente</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl">
                        <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                            <Info className="w-3.5 h-3.5" /> Notas de Asignación
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium italic">
                            {asignacion.observaciones || "Sin observaciones adicionales reportadas al momento de la entrega."}
                        </p>
                    </div>
                </div>

                {/* Columna Derecha: Items Asignados */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <Package className="w-5 h-5 text-indigo-500" />
                                Recursos Entregados
                                <Badge className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 border-none font-black ml-2">{asignacion.detalles?.length || 0}</Badge>
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {asignacion.detalles?.map((item, idx) => (
                                <div key={idx} className="group relative flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-transparent hover:border-indigo-500/30 transition-all duration-300">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-400 group-hover:text-indigo-500 transition-colors">
                                            {item.activo_id
                                                ? <Laptop className="w-6 h-6" />
                                                : <Smartphone className="w-6 h-6" />
                                            }
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{item.modelo_nombre}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                {item.activo_id ? (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase">
                                                        S/N: {item.activo_numero_serie}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        Cantidad: {item.cantidad} unidades
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <MapPin className="w-3 h-3" /> {item.activo_ubicacion || 'Oficina'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block">
                                        {item.devuelto ? (
                                            <Badge className="bg-red-50 text-red-600 dark:bg-red-950/30 border-none font-black text-[9px] uppercase px-3 py-1">Devuelto</Badge>
                                        ) : (
                                            <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 border-none font-black text-[9px] uppercase px-3 py-1">En Uso</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-8 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
                        <ClipboardCheck className="w-10 h-10 flex-shrink-0 opacity-50" />
                        <div>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Validación de Activos</p>
                            <p className="text-xs opacity-60">Este documento certifica que los activos listados fueron entregados en condiciones óptimas para su operación al beneficiario mencionado.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
