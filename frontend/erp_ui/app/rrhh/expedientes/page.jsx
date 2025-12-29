'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    FileText, Check, X, Eye, Calendar,
    AlertCircle, Loader2, Users, Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
    getAdminVacaciones, aprobarVacaciones, rechazarVacaciones,
    getAdminDocumentos, aprobarDocumento, rechazarDocumento,
    getAdminIncapacidades, validarIncapacidad
} from '@/services/rrhh';

export default function ExpedientesManagement() {
    const [docs, setDocs] = useState([]);
    const [vacaciones, setVacaciones] = useState([]);
    const [incapacidades, setIncapacidades] = useState([]);
    const [loading, setLoading] = useState(true);

    const stats = [
        {
            label: 'Documentos Pendientes',
            value: docs.filter(d => d.estatus === 'PENDIENTE').length || 0,
            icon: FileText,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Vacaciones Pendientes',
            value: vacaciones.filter(v => v.estatus === 'PENDIENTE').length || 0,
            icon: Calendar,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Incapacidades',
            value: incapacidades.filter(i => i.estatus === 'PENDIENTE').length || 0,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Total Solicitudes',
            value: docs.length + vacaciones.length + incapacidades.length || 0,
            icon: Users,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [d, v, i] = await Promise.all([
                getAdminDocumentos(),
                getAdminVacaciones(),
                getAdminIncapacidades()
            ]);
            setDocs(Array.isArray(d.data) ? d.data : (d.data.results || []));
            setVacaciones(Array.isArray(v.data) ? v.data : (v.data.results || []));
            setIncapacidades(Array.isArray(i.data) ? i.data : (i.data.results || []));
        } catch (error) {
            console.error(error);
            toast.error('Error cargando expedientes');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveDoc = async (id) => {
        try {
            await aprobarDocumento(id);
            toast.success('Documento aprobado');
            loadData();
        } catch (error) {
            toast.error('Error al aprobar documento');
        }
    };

    const handleRejectDoc = async (id) => {
        const reason = prompt('Motivo de rechazo:');
        if (!reason) return;
        try {
            await rechazarDocumento(id, { motivo: reason });
            toast.success('Documento rechazado');
            loadData();
        } catch (error) {
            toast.error('Error al rechazar documento');
        }
    };

    const handleApproveVac = async (id) => {
        try {
            await aprobarVacaciones(id, { observaciones: 'Aprobado por Admin' });
            toast.success('Vacaciones aprobadas');
            loadData();
        } catch (error) {
            toast.error('Error al aprobar vacaciones');
        }
    };

    const handleRejectVac = async (id) => {
        const r = prompt('Razón:');
        if (!r) return;
        try {
            await rechazarVacaciones(id, { observaciones: r });
            toast.success('Vacaciones rechazadas');
            loadData();
        } catch (error) {
            toast.error('Error al rechazar vacaciones');
        }
    };

    const pendingDocs = docs.filter(d => d.estatus === 'PENDIENTE');
    const pendingVac = vacaciones.filter(v => v.estatus === 'PENDIENTE');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <FileText className="text-purple-600 dark:text-purple-400 w-8 h-8" />
                            Gestión de Expedientes
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Revisión y aprobación de documentos y solicitudes
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Documentos Pendientes */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Documentos Pendientes
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Empleado</th>
                                        <th className="px-4 py-3 text-left">Documento</th>
                                        <th className="px-4 py-3 text-left">Fecha</th>
                                        <th className="px-4 py-3 text-left">Archivo</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {pendingDocs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{doc.empleado_nombre}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{doc.tipo_documento_display}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(doc.fecha_subida).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <a href={doc.archivo} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                    <Eye className="w-4 h-4" /> Ver
                                                </a>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-center">
                                                    <Button size="sm" variant="outline" onClick={() => handleApproveDoc(doc.id)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleRejectDoc(doc.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingDocs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No hay documentos pendientes</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Solicitudes de Vacaciones */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Solicitudes de Vacaciones
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Empleado</th>
                                        <th className="px-4 py-3 text-left">Fechas</th>
                                        <th className="px-4 py-3 text-left">Días</th>
                                        <th className="px-4 py-3 text-left">Motivo</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {pendingVac.map(vac => (
                                        <tr key={vac.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{vac.empleado_nombre}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{vac.fecha_inicio} al {vac.fecha_fin}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{vac.dias_solicitados}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs">{vac.motivo}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-center">
                                                    <Button size="sm" variant="outline" onClick={() => handleApproveVac(vac.id)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleRejectVac(vac.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingVac.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No hay solicitudes pendientes</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
