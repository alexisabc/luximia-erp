'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    AlertTriangle, CheckCircle, XCircle, Clock, Shield,
    RefreshCw, FileText, User, Calendar, Search, Lock, ArrowLeft
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import {
    getCancelacionesPendientes,
    autorizarCancelacion,
    rechazarCancelacion,
    getSolicitudesCancelacion
} from '@/services/pos';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function CancelacionesPage() {
    const { user, hasPermission } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [pendientes, setPendientes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [activeTab, setActiveTab] = useState('pendientes');
    const [unauthorized, setUnauthorized] = useState(false);

    // Modal de autorización
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [codigoAuth, setCodigoAuth] = useState('');
    const [comentariosAuth, setComentariosAuth] = useState('');
    const [procesando, setProcesando] = useState(false);

    // Modal de rechazo
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    // Verificar permisos al cargar
    useEffect(() => {
        if (user !== null) {
            const canAccess = user?.is_staff || hasPermission?.('pos.authorize_cancellation');
            if (!canAccess) {
                setUnauthorized(true);
                setLoading(false);
            }
        }
    }, [user, hasPermission]);

    const fetchData = useCallback(async () => {
        if (unauthorized) return;

        setLoading(true);
        try {
            // Obtener pendientes
            const pendientesRes = await getCancelacionesPendientes();
            setPendientes(pendientesRes.data.results || []);

            // Obtener historial
            const historialRes = await getSolicitudesCancelacion();
            setHistorial(historialRes.data.results || historialRes.data || []);
        } catch (error) {
            console.error(error);
            // toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [unauthorized]);

    useEffect(() => {
        if (!unauthorized) {
            fetchData();

            // Auto-refresh cada 30 segundos
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchData, unauthorized]);

    // Si no tiene permisos, mostrar mensaje de error
    if (unauthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <Card className="max-w-md shadow-xl border-0">
                    <CardHeader className="text-center pb-2">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-red-600">Acceso Denegado</CardTitle>
                        <CardDescription className="text-base mt-2">
                            No tienes permisos para gestionar cancelaciones
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                Esta funcionalidad está reservada para <strong>supervisores</strong> con el permiso de autorizar cancelaciones.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/pos/terminal')}
                            className="w-full"
                            variant="outline"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al Terminal POS
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleAutorizar = async () => {
        if (codigoAuth.length !== 6) {
            toast.error('El código debe tener 6 dígitos');
            return;
        }

        setProcesando(true);
        try {
            await autorizarCancelacion(selectedSolicitud.id, codigoAuth, comentariosAuth);
            toast.success(`Cancelación del ticket ${selectedSolicitud.venta_folio} autorizada`);
            setShowAuthModal(false);
            setCodigoAuth('');
            setComentariosAuth('');
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.detail || 'Error al autorizar';
            toast.error(msg);
        } finally {
            setProcesando(false);
        }
    };

    const handleRechazar = async () => {
        if (motivoRechazo.length < 5) {
            toast.error('El motivo debe tener al menos 5 caracteres');
            return;
        }

        setProcesando(true);
        try {
            await rechazarCancelacion(selectedSolicitud.id, motivoRechazo);
            toast.success('Solicitud rechazada');
            setShowRejectModal(false);
            setMotivoRechazo('');
            fetchData();
        } catch (error) {
            toast.error('Error al rechazar');
        } finally {
            setProcesando(false);
        }
    };

    const abrirModalAutorizacion = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setCodigoAuth('');
        setComentariosAuth('');
        setShowAuthModal(true);
    };

    const abrirModalRechazo = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setMotivoRechazo('');
        setShowRejectModal(true);
    };

    const getEstadoBadge = (estado) => {
        const map = {
            'PENDIENTE': { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
            'APROBADA': { variant: 'success', icon: CheckCircle, color: 'text-green-600' },
            'RECHAZADA': { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
            'EXPIRADA': { variant: 'outline', icon: AlertTriangle, color: 'text-gray-600' },
        };
        const config = map[estado] || { variant: 'outline', icon: Clock, color: 'text-gray-600' };
        const Icon = config.icon;
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {estado}
            </Badge>
        );
    };

    const columns = [
        {
            header: 'Ticket',
            accessorKey: 'venta_folio',
            cell: (row) => (
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {row.venta_folio}
                </span>
            )
        },
        {
            header: 'Total',
            accessorKey: 'venta_total',
            cell: (row) => (
                <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    ${parseFloat(row.venta_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'Solicitante',
            accessorKey: 'solicitante_nombre',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{row.solicitante_nombre_completo || row.solicitante_nombre}</span>
                </div>
            )
        },
        {
            header: 'Motivo',
            accessorKey: 'motivo',
            cell: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
                    {row.motivo}
                </span>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => getEstadoBadge(row.estado)
        },
        {
            header: 'Tiempo',
            accessorKey: 'tiempo_transcurrido',
            cell: (row) => (
                <span className="text-sm text-gray-500">
                    {row.tiempo_transcurrido}
                </span>
            )
        },
    ];

    const stats = [
        {
            label: 'Pendientes',
            value: pendientes.length,
            icon: Clock,
            gradient: 'from-yellow-500 to-orange-600',
        },
        {
            label: 'Aprobadas Hoy',
            value: historial.filter(h => h.estado === 'APROBADA').length,
            icon: CheckCircle,
            gradient: 'from-green-500 to-emerald-600',
        },
        {
            label: 'Rechazadas Hoy',
            value: historial.filter(h => h.estado === 'RECHAZADA').length,
            icon: XCircle,
            gradient: 'from-red-500 to-rose-600',
        },
        {
            label: 'Total Solicitudes',
            value: historial.length,
            icon: FileText,
            gradient: 'from-blue-500 to-indigo-600',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-orange-500" />
                            Autorización de Cancelaciones
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Gestiona las solicitudes de cancelación de tickets del POS
                        </p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                            </div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Selector de Pestañas Simple */}
            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl mb-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('pendientes')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'pendientes'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/30'
                        }`}
                >
                    <Clock className="w-4 h-4" /> Pendientes
                    {pendientes.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                            {pendientes.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'historial'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/30'
                        }`}
                >
                    <FileText className="w-4 h-4" /> Historial
                </button>
            </div>

            {/* Contenido de Pestañas */}
            {activeTab === 'pendientes' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-300">
                    <ReusableTable
                        data={pendientes}
                        columns={columns}
                        loading={loading}
                        actions={{
                            custom: [
                                {
                                    icon: CheckCircle,
                                    label: 'Autorizar',
                                    onClick: abrirModalAutorizacion,
                                    tooltip: 'Autorizar cancelación',
                                    className: 'text-green-600 hover:text-green-700'
                                },
                                {
                                    icon: XCircle,
                                    label: 'Rechazar',
                                    onClick: abrirModalRechazo,
                                    tooltip: 'Rechazar cancelación',
                                    className: 'text-red-600 hover:text-red-700'
                                }
                            ]
                        }}
                    />
                    {pendientes.length === 0 && !loading && (
                        <div className="p-16 text-center text-gray-400">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-200 dark:text-green-900/30" />
                            <p className="text-xl font-bold">Sin solicitudes pendientes</p>
                            <p className="text-sm">Todo está al día</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'historial' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-300">
                    <ReusableTable
                        data={historial}
                        columns={[
                            ...columns,
                            {
                                header: 'Autorizado Por',
                                accessorKey: 'autorizado_por_nombre',
                                cell: (row) => row.autorizado_por_nombre ? (
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        <span>{row.autorizado_por_nombre}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )
                            }
                        ]}
                        loading={loading}
                        onSearch={() => { }}
                    />
                </div>
            )}

            {/* Modal de Autorización */}
            <ReusableModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                title="Autorizar Cancelación"
                size="md"
            >
                {selectedSolicitud && (
                    <div className="space-y-6">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Ticket:</span>
                                    <p className="font-bold text-lg text-indigo-600">{selectedSolicitud.venta_folio}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Total:</span>
                                    <p className="font-bold text-lg text-red-600">
                                        ${parseFloat(selectedSolicitud.venta_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Solicitante:</span>
                                    <p className="font-medium">{selectedSolicitud.solicitante_nombre_completo || selectedSolicitud.solicitante_nombre}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Motivo:</span>
                                    <p className="text-gray-700 dark:text-gray-300 italic">"{selectedSolicitud.motivo}"</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="flex items-center gap-2 mb-2">
                                <Lock className="w-4 h-4 text-blue-500" />
                                Código de Autorización (TOTP)
                            </Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={codigoAuth}
                                onChange={(e) => setCodigoAuth(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="text-center text-3xl tracking-[0.5em] font-mono h-16 focus:ring-blue-500"
                                autoFocus
                            />
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Ingresa el código de 6 dígitos generado en tu aplicación autenticadora.
                            </p>
                        </div>

                        <div>
                            <Label>Comentarios de Autorización (opcional)</Label>
                            <Textarea
                                value={comentariosAuth}
                                onChange={(e) => setComentariosAuth(e.target.value)}
                                placeholder="Ej: Autorizado tras verificar mercancía devuelta..."
                                className="mt-2"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowAuthModal(false)}
                                disabled={procesando}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                onClick={handleAutorizar}
                                disabled={codigoAuth.length !== 6 || procesando}
                            >
                                {procesando ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Confirmar Autorización
                            </Button>
                        </div>
                    </div>
                )}
            </ReusableModal>

            {/* Modal de Rechazo */}
            <ReusableModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Rechazar Solicitud"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Indica el motivo por el cual rechazas esta solicitud de cancelación. El cajero podrá ver este mensaje.
                    </p>
                    <Textarea
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        placeholder="Escribe el motivo del rechazo aquí..."
                        className="min-h-[100px]"
                        autoFocus
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowRejectModal(false)}
                            disabled={procesando}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleRechazar}
                            disabled={motivoRechazo.length < 5 || procesando}
                        >
                            {procesando ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Rechazar Solicitud
                        </Button>
                    </div>
                </div>
            </ReusableModal>
        </div>
    );
}
