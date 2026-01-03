'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import obrasService from '@/services/obras.service';
import { HardHat, Plus, ArrowRight } from 'lucide-react';
import FeatureGuard from '@/components/config/FeatureGuard';

export default function ObrasPage() {
    return (
        <FeatureGuard feature="MODULE_OBRAS">
            <ObrasList />
        </FeatureGuard>
    );
}

function ObrasList() {
    const [obras, setObras] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        obrasService.getObras()
            .then(data => setObras(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proyectos y Obras</h1>
                    <p className="text-gray-500 text-sm">Gestión de construcciones y presupuestos</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    Nueva Obra
                </button>
            </div>

            {obras.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <HardHat size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No hay obras activas</h3>
                    <p className="text-gray-500 mb-4">Comienza registrando tu primer proyecto de construcción.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {obras.map(obra => (
                        <div
                            key={obra.id}
                            onClick={() => router.push(`/obras/${obra.id}`)}
                            className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>

                            <div className="flex justify-between items-start mb-3 pl-2">
                                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-mono px-2 py-1 rounded">
                                    {obra.codigo}
                                </span>
                                <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                    Activa
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 pl-2 group-hover:text-blue-600 transition-colors">
                                {obra.nombre}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4 pl-2 line-clamp-1">
                                {obra.cliente || 'Cliente Interno'}
                            </p>

                            <div className="pl-2 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-400 uppercase">Presupuesto</div>
                                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                        ${parseFloat(obra.presupuesto_total).toLocaleString('es-MX')}
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                    <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
