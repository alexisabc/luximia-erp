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
import ReusableModal from '@/components/modals/Reusable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="pendientes" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pendientes
                        {pendientes.length > 0 && (
                            <Badge variant="destructive" className="ml-1">{pendientes.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Historial
                    </TabsTrigger>
                </TabsList>

                {/* Tab Pendientes */}
                <TabsContent value="pendientes">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
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
                            <div className="p-12 text-center text-gray-500">
                                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                                <p className="text-lg font-medium">Sin solicitudes pendientes</p>
                                <p className="text-sm">Todas las cancelaciones han sido procesadas</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Tab Historial */}
                <TabsContent value="historial">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
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
                </TabsContent>
            </Tabs>

            {/* Modal de Autorización */}
            <ReusableModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                title="Autorizar Cancelación"
                size="md"
            >
                {selectedSolicitud && (
                    <div className="space-y-6">
                        {/* Información del ticket */}
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
                                    <p className="text-gray-700 dark:text-gray-300">{selectedSolicitud.motivo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Código de autorización */}
                        <div>
                            <Label className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Código de Autorización *
                            </Label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={codigoAuth}
                                onChange={(e) => setCodigoAuth(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ingresa tu código TOTP de 6 dígitos"
                                className="text-center text-2xl tracking-widest font-mono mt-2"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ingresa el código de tu app autenticadora (Google Authenticator, Authy, etc.)
                            </p>
                        </div>

                        {/* Comentarios */}
                        <div>
                            <Label>Comentarios (opcional)</Label>
                            <Textarea
                                value={comentariosAuth}
                                onChange={(e) => setComentariosAuth(e.target.value)}
                                placeholder="Agrega un comentario sobre esta autorización..."
                                className="mt-2"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowAuthModal(false)}
                                disabled={procesando}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAutorizar}
                                disabled={codigoAuth.length !== 6 || procesando}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {procesando ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Autorizar Cancelación
                            </Button>
                        </div>
                    </div>
                )}
            </ReusableModal>

            {/* Modal de Rechazo */}
            <ReusableModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Rechazar Cancelación"
                size="md"
            >
                {selectedSolicitud && (
                    <div className="space-y-6">
                        {/* Información del ticket */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Ticket:</span>
                                    <p className="font-bold text-lg">{selectedSolicitud.venta_folio}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Solicitante:</span>
                                    <p className="font-medium">{selectedSolicitud.solicitante_nombre}</p>
                                </div>
                            </div>
                        </div>

                        {/* Motivo del rechazo */}
                        <div>
                            <Label>Motivo del Rechazo *</Label>
                            <Textarea
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                placeholder="Explica por qué se rechaza esta solicitud..."
                                className="mt-2"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Mínimo 5 caracteres. Este motivo será visible para el cajero.
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(false)}
                                disabled={procesando}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleRechazar}
                                disabled={motivoRechazo.length < 5 || procesando}
                                variant="destructive"
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
                )}
            </ReusableModal>
        </div>
    );
}
