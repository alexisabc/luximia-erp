'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import obrasService from '@/services/obras.service';
import CostCenterTree from '@/components/obras/CostCenterTree';
import { Calendar, DollarSign, MapPin, FileEdit, TrendingUp, Archive } from 'lucide-react';

export default function ObraDashboard() {
    const params = useParams(); // useParams retorna un objeto, y en Next.js app router puede ser una promesa o objeto directo segun version. En 15 suele ser directo o `use` hook.
    // En las versiones recientes de Next.js params podría necesitar React.use(). Pero useParams() hook estándar de next/navigation funciona bien.
    const { id } = params;

    const [obra, setObra] = useState(null);
    const [centrosCostos, setCentrosCostos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!id) return;
                const [obraData, ccData] = await Promise.all([
                    obrasService.getObra(id),
                    obrasService.getCentrosCostos(id)
                ]);
                setObra(obraData);
                setCentrosCostos(ccData);
            } catch (error) {
                console.error("Error cargando obra:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!obra) return <div className="p-8 text-center text-red-500">Obra no encontrada</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {obra.nombre}
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border dark:border-gray-700">
                                {obra.codigo}
                            </span>
                        </h1>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {obra.direccion || 'Sin dirección registrada'}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Inició: {obra.fecha_inicio}</span>
                        </div>
                    </div>
                    <div className="text-right w-full md:w-auto p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Presupuesto Total</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${parseFloat(obra.presupuesto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* KPIs Rápidos */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Estimado</div>
                        <div className="text-lg font-bold text-blue-800 dark:text-blue-200">$0.00</div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">Comprometido</div>
                        <div className="text-lg font-bold text-orange-800 dark:text-orange-200">$0.00</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Ejecutado</div>
                        <div className="text-lg font-bold text-purple-800 dark:text-purple-200">$0.00</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Disponible Real</div>
                        <div className="text-lg font-bold text-green-800 dark:text-green-200">
                            ${parseFloat(obra.presupuesto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gestión Avanzada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href={`/obras/${id}/cronograma`} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 transition-all flex items-center justify-between group shadow-sm">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Cronograma (CPM)</div>
                        <div className="text-sm text-gray-500">Ruta crítica</div>
                    </div>
                    <Calendar className="text-gray-400 group-hover:text-blue-500" />
                </a>
                <a href={`/obras/${id}/recursos`} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between group shadow-sm">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Recursos</div>
                        <div className="text-sm text-gray-500">Asignación</div>
                    </div>
                    <DollarSign className="text-gray-400 group-hover:text-emerald-500" />
                </a>
                <a href={`/obras/${id}/costos`} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-500 transition-all flex items-center justify-between group shadow-sm">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Costos (EVM)</div>
                        <div className="text-sm text-gray-500">Métricas y Curva S</div>
                    </div>
                    <TrendingUp className="text-gray-400 group-hover:text-purple-500" />
                </a>
                <a href={`/obras/${id}/cambios`} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-amber-500 transition-all flex items-center justify-between group shadow-sm">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Gestión de Cambios</div>
                        <div className="text-sm text-gray-500">Aditivas y Reprogramaciones</div>
                    </div>
                    <FileEdit className="text-gray-400 group-hover:text-amber-500" />
                </a>
                <a href={`/obras/${id}/cierre`} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between group shadow-sm">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Cierre de Proyecto</div>
                        <div className="text-sm text-gray-500">Post-mortem y Liquidación</div>
                    </div>
                    <Archive className="text-gray-400 group-hover:text-emerald-500" />
                </a>
            </div>

            {/* Arbol de Costos */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded-full inline-block"></span>
                        Estructura de Costos (WBS)
                    </h2>
                    <button className="text-sm text-blue-600 hover:underline">
                        + Nueva Partida
                    </button>
                </div>
                <CostCenterTree nodes={centrosCostos} />
            </div>
        </div >
    );
}
