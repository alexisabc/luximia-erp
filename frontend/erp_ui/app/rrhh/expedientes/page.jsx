'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Check, X, Eye, FileText, Calendar, AlertCircle } from 'lucide-react';
import {
    getAdminVacaciones,
    aprobarVacaciones,
    rechazarVacaciones,
    getAdminDocumentos,
    aprobarDocumento,
    rechazarDocumento,
    getAdminIncapacidades,
    validarIncapacidad
} from '@/services/rrhh';

const StatusBadge = ({ status }) => {
    const styles = {
        'PENDIENTE': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        'APROBADO': 'bg-green-500/10 text-green-600 border-green-500/20',
        'VALIDADO': 'bg-green-500/10 text-green-600 border-green-500/20',
        'RECHAZADO': 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
};

export default function ExpedientesManagement() {
    const [activeTab, setActiveTab] = useState('documentos');
    const [docs, setDocs] = useState([]);
    const [vacaciones, setVacaciones] = useState([]);
    const [incapacidades, setIncapacidades] = useState([]);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    const handleApproveDoc = async (id) => {
        if (!confirm('¿Aprobar documento?')) return;
        await aprobarDocumento(id);
        loadData();
    };

    const handleRejectDoc = async (id) => {
        const reason = prompt('Motivo de rechazo:');
        if (!reason) return;
        await rechazarDocumento(id, { motivo: reason });
        loadData();
    };

    const handleApproveVac = async (id) => {
        await aprobarVacaciones(id, { observaciones: 'Aprobado por Admin' });
        loadData();
    };

    const handleRejectVac = async (id) => {
        const r = prompt('Razón:');
        if (!r) return;
        await rechazarVacaciones(id, { observaciones: r });
        loadData();
    };

    if (loading) return <div className="p-8">Cargando gestión...</div>;

    const pendingDocs = docs.filter(d => d.estatus === 'PENDIENTE');
    const pendingVac = vacaciones.filter(v => v.estatus === 'PENDIENTE');

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" /> Gestión de Expedientes y Solicitudes
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4 border-l-4 border-yellow-500">
                    <h3 className="font-bold text-lg">{pendingDocs.length}</h3>
                    <p className="text-sm text-muted-foreground">Documentos por Revisar</p>
                </Card>
                <Card className="p-4 border-l-4 border-blue-500">
                    <h3 className="font-bold text-lg">{pendingVac.length}</h3>
                    <p className="text-sm text-muted-foreground">Solicitudes de Vacaciones</p>
                </Card>
                <Card className="p-4 border-l-4 border-red-500">
                    <h3 className="font-bold text-lg">{incapacidades.filter(i => i.estatus === 'PENDIENTE').length}</h3>
                    <p className="text-sm text-muted-foreground">Incapacidades Pendientes</p>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="font-bold text-xl">Documentos Pendientes</h2>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Empleado</th>
                                <th className="px-4 py-3">Documento</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Archivo</th>
                                <th className="px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {pendingDocs.map(doc => (
                                <tr key={doc.id}>
                                    <td className="px-4 py-3 font-bold">{doc.empleado_nombre}</td>
                                    <td className="px-4 py-3">{doc.tipo_documento_display}</td>
                                    <td className="px-4 py-3">{new Date(doc.fecha_subida).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <a href={doc.archivo} target="_blank" className="text-primary hover:underline flex items-center gap-1">
                                            <Eye className="w-4 h-4" /> Ver
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button onClick={() => handleApproveDoc(doc.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleRejectDoc(doc.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingDocs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No hay documentos pendientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h2 className="font-bold text-xl pt-4">Solicitudes de Vacaciones</h2>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Empleado</th>
                                <th className="px-4 py-3">Fechas</th>
                                <th className="px-4 py-3">Días</th>
                                <th className="px-4 py-3">Motivo</th>
                                <th className="px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {pendingVac.map(vac => (
                                <tr key={vac.id}>
                                    <td className="px-4 py-3 font-bold">{vac.empleado_nombre}</td>
                                    <td className="px-4 py-3">{vac.fecha_inicio} al {vac.fecha_fin}</td>
                                    <td className="px-4 py-3">{vac.dias_solicitados}</td>
                                    <td className="px-4 py-3 truncate max-w-xs">{vac.motivo}</td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button onClick={() => handleApproveVac(vac.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleRejectVac(vac.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingVac.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No hay solicitudes pendientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
