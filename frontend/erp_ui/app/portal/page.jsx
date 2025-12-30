'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import {
    Calendar, FileText, Upload, Clock, CheckCircle, XCircle,
    AlertCircle, Briefcase, HeartPulse, Shield, Sun, Eye
} from 'lucide-react';
import {
    getVacacionesBalance,
    getSolicitudesVacaciones,
    createSolicitudVacaciones,
    getPermisos,
    createSolicitudPermiso,
    getIncapacidades,
    createIncapacidad,
    getDocumentosExpediente,
    uploadDocumentoExpediente
} from '@/services/rrhh';
import { useAuth } from '@/context/AuthContext';
import DataTable from '@/components/organisms/DataTable';
import FormModal from '@/components/modals/Form';
import Overlay from '@/components/loaders/Overlay';

// Styled Tabs Component
const Tabs = ({ activeTab, setActiveTab, tabs }) => (
    <div className="flex space-x-1 p-1 bg-muted/30 rounded-xl mb-6 overflow-x-auto border border-border/50">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
            >
                {tab.label}
            </button>
        ))}
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'PENDIENTE': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        'APROBADO': 'bg-green-500/10 text-green-600 border-green-500/20',
        'VALIDADO': 'bg-green-500/10 text-green-600 border-green-500/20',
        'RECHAZADO': 'bg-red-500/10 text-red-600 border-red-500/20',
        'CANCELADO': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles['PENDIENTE']}`}>
            {status}
        </span>
    );
};

export default function EmployeePortal() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [balance, setBalance] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [incapacidades, setIncapacidades] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'vacaciones' | 'permiso'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balRes, vacRes, permRes, incRes, docRes] = await Promise.all([
                getVacacionesBalance(),
                getSolicitudesVacaciones(),
                getPermisos(),
                getIncapacidades(),
                getDocumentosExpediente()
            ]);

            setBalance(balRes.data);

            const vacs = Array.isArray(vacRes.data) ? vacRes.data : (vacRes.data.results || []);
            const perms = Array.isArray(permRes.data) ? permRes.data : (permRes.data.results || []);

            // Unify history for the table
            const history = [
                ...vacs.map(v => ({ ...v, tipo: 'Vacaciones', fecha_range: `${v.fecha_inicio} - ${v.fecha_fin}` })),
                ...perms.map(p => ({ ...p, tipo: 'Permiso', fecha_range: p.fecha || `${p.fecha_inicio} - ${p.fecha_fin}` }))
            ].sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));

            setHistoryData(history);
            setIncapacidades(Array.isArray(incRes.data) ? incRes.data : (incRes.data.results || []));
            setDocumentos(Array.isArray(docRes.data) ? docRes.data : (docRes.data.results || []));
        } catch (error) {
            console.error("Error loading portal data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type) => {
        setModalType(type);
        setFormData({});
        setIsFormModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'vacaciones') {
                await createSolicitudVacaciones(formData);
            } else if (modalType === 'permiso') {
                await createSolicitudPermiso(formData);
            }
            setIsFormModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al crear la solicitud. Verifica los datos.');
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await uploadDocumentoExpediente({
                tipo_documento: type,
                archivo: file
            });
            fetchData();
        } catch (error) {
            alert('Error subiendo documento');
        }
    };

    const DocItem = ({ type, label }) => {
        const doc = documentos.find(d => d.tipo_documento === type);
        return (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${doc ? (doc.estatus === 'APROBADO' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600') : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        {doc ? <CheckCircle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            {doc ? `Subido: ${new Date(doc.fecha_subida).toLocaleDateString()} • ${doc.estatus}` : 'Pendiente de subir'}
                        </p>
                    </div>
                </div>
                <label className="cursor-pointer px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                    {doc ? 'Actualizar' : 'Subir'}
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, type)} accept=".pdf,.jpg,.png" />
                </label>
            </div>
        );
    };

    const columns = [
        { header: 'Tipo', accessorKey: 'tipo', render: (row) => <span className="font-bold">{row.tipo}</span> },
        { header: 'Fechas', accessorKey: 'fecha_range' },
        { header: 'Motivo', accessorKey: 'motivo', render: (row) => <span className="truncate max-w-[200px] block" title={row.motivo}>{row.motivo}</span> },
        { header: 'Estatus', accessorKey: 'estatus', render: (row) => <StatusBadge status={row.estatus} /> },
    ];

    if (loading && !balance) return <Overlay className="h-full" />;

    return (
        <div className="h-full w-full overflow-y-auto p-4 lg:p-8 space-y-8 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white">
                        <Sun className="w-8 h-8 text-yellow-500" />
                        Portal del Empleado
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Hola, <span className="text-primary">{user?.first_name || 'Compañero'}</span>. Gestiona tus beneficios y expediente aquí.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Fecha Actual</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Días Disponibles</p>
                        <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{balance?.dias_restantes || 0}</h2>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2 font-medium">De un total de {balance?.dias_totales || 0} anuales</p>
                    </div>
                    <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/10 group-hover:scale-110 transition-transform duration-500" />
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Prima Vacacional</p>
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Al Día</h2>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2 font-medium">Periodo {new Date().getFullYear()}</p>
                    </div>
                    <Briefcase className="absolute -right-4 -bottom-4 w-32 h-32 text-purple-500/10 group-hover:scale-110 transition-transform duration-500" />
                </Card>

                <Card className="p-6 flex flex-col justify-center gap-3 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-none">
                    <button
                        onClick={() => handleOpenModal('vacaciones')}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-5 h-5" /> Solicitar Vacaciones
                    </button>
                    <button
                        onClick={() => handleOpenModal('permiso')}
                        className="w-full py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Clock className="w-5 h-5" /> Pedir Permiso
                    </button>
                </Card>
            </div>

            {/* Tabs & Content */}
            <div>
                <Tabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tabs={[
                        { id: 'dashboard', label: 'Mis Solicitudes' },
                        { id: 'incapacidades', label: 'Incapacidades' },
                        { id: 'expediente', label: 'Expediente Digital' }
                    ]}
                />

                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-4 flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
                            <Clock className="w-5 h-5 text-primary" /> Historial Reciente
                        </div>
                        <DataTable
                            data={historyData}
                            columns={columns}
                            search={false} // Small list, search might be overkill but can be enabled
                            pageSize={5}
                        />
                    </div>
                )}

                {activeTab === 'incapacidades' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <HeartPulse className="w-6 h-6" /> Reportar Incapacidad
                                </h3>
                                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1 max-w-xl">
                                    Si has sufrido una enfermedad o accidente, sube tu certificado del IMSS aquí para justificar tu ausencia y procesar el pago correspondiente.
                                </p>
                            </div>
                            {/* NOTE: For simplicity, keeping manual flow or add specialized modal later for file upload */}
                            <button
                                className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 hover:scale-105 transition-all w-full sm:w-auto"
                                onClick={() => alert('Por favor contacta a RRHH para subir tu incapacidad por el momento.')}
                            >
                                Nueva Incapacidad
                            </button>
                        </div>

                        {incapacidades.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {incapacidades.map(inc => (
                                    <Card key={inc.id} className="p-5 flex flex-col gap-3 group hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{inc.tipo_display}</span>
                                            <StatusBadge status={inc.estatus} />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-2xl text-gray-900 dark:text-white">{inc.dias} días</h4>
                                            <p className="text-xs text-gray-500 font-medium">{inc.fecha_inicio} — {inc.fecha_fin}</p>
                                        </div>
                                        <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                            <span className="text-xs text-gray-400 font-mono">Folio: {inc.folio_imss}</span>
                                            {inc.documento_adjunto && (
                                                <a href={inc.documento_adjunto} target="_blank" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> Ver
                                                </a>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No tienes incapacidades registradas.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'expediente' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6">
                            <h3 className="font-bold text-xl flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                                <FileText className="w-6 h-6 text-primary" /> Documentación Digital
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Mantén tu expediente al día. Asegúrate de que los documentos sean legibles (PDF o Imagen).</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <DocItem type="INE" label="INE / Identificación Oficial" />
                            <DocItem type="CURP" label="CURP" />
                            <DocItem type="ACTA_NACIMIENTO" label="Acta de Nacimiento" />
                            <DocItem type="CSF" label="Constancia de Situación Fiscal" />
                            <DocItem type="NSS" label="Número de Seguridad Social" />
                            <DocItem type="COMPROBANTE_DOMICILIO" label="Comprobante de Domicilio" />
                            <DocItem type="TITULO" label="Título Profesional" />
                            <DocItem type="CEDULA" label="Cédula Profesional" />
                        </div>
                    </div>
                )}
            </div>

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={modalType === 'vacaciones' ? 'Solicitar Vacaciones' : 'Solicitar Permiso'}
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                submitText="Enviar Solicitud"
                maxWidth="max-w-md"
                fields={
                    modalType === 'vacaciones' ? [
                        { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
                        { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true },
                        { name: 'dias_solicitados', label: 'Días a tomar', type: 'number', required: true },
                        { name: 'motivo', label: 'Motivo (Opcional)', type: 'textarea', placeholder: 'Ej. Vacaciones anuales...' }
                    ] : [
                        { name: 'fecha_inicio', label: 'Fecha', type: 'date', required: true },
                        { name: 'hora', label: 'Hora (Opcional)', type: 'time' },
                        { name: 'motivo', label: 'Motivo del Permiso', type: 'textarea', required: true, placeholder: 'Ej. Cita médica...' }
                    ]
                }
            />
        </div>
    );
}
