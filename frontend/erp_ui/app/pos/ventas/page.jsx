'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import moment from 'moment';
import {
    XCircle, Printer, Terminal, DollarSign,
    ShoppingCart, TrendingUp, AlertCircle, Loader2, FileText
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { getVentas, cancelarVenta } from '@/services/pos';

export default function HistorialVentasPage() {
    const [loading, setLoading] = useState(true);
    const [ventas, setVentas] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [ventaCancel, setVentaCancel] = useState(null);
    const [supervisorUser, setSupervisorUser] = useState('');
    const [supervisorCode, setSupervisorCode] = useState('');
    const [cancelMotivo, setCancelMotivo] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

    const stats = [
        {
            label: 'Total Ventas',
            value: totalItems || 0,
            icon: ShoppingCart,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Ventas Hoy',
            value: ventas.filter(v => moment(v.fecha).isSame(moment(), 'day')).length || 0,
            icon: TrendingUp,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Total Recaudado',
            value: ventas.length > 0
                ? `$${ventas.filter(v => v.estado === 'PAGADA').reduce((sum, v) => sum + parseFloat(v.total || 0), 0).toFixed(2)}`
                : '$0.00',
            icon: DollarSign,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            isAmount: true
        },
        {
            label: 'Canceladas',
            value: ventas.filter(v => v.estado === 'CANCELADA').length || 0,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    const fetchVentas = async () => {
        setLoading(true);
        try {
            const { data } = await getVentas(page, pageSize, { search });
            setVentas(data.results);
            setTotalItems(data.count);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando ventas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVentas();
    }, [page, pageSize, search]);

    const handleCancelar = async () => {
        if (!supervisorUser || !supervisorCode || !cancelMotivo) {
            return toast.warning("Todos los campos son obligatorios para cancelar");
        }
        setCancelLoading(true);
        try {
            await cancelarVenta(ventaCancel.id, {
                supervisor_username: supervisorUser,
                supervisor_code: supervisorCode,
                motivo: cancelMotivo
            });
            toast.success("Venta cancelada exitosamente");
            setVentaCancel(null);
            fetchVentas();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al cancelar venta");
        } finally {
            setCancelLoading(false);
        }
    };

    const columns = [
        {
            header: 'Venta',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-mono font-bold text-gray-900 dark:text-white">{row.folio}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{moment(row.fecha).format('DD/MM/YYYY HH:mm')}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Cliente',
            render: (row) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{row.cliente_nombre}</div>
                    <div className="text-gray-500 dark:text-gray-400">{row.cajero_nombre}</div>
                </div>
            )
        },
        {
            header: 'Total',
            render: (row) => (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(row.total).toFixed(2)}
                </span>
            )
        },
        {
            header: 'Método',
            render: (row) => (
                <Badge variant="outline" className="text-xs font-normal">
                    {row.metodo_pago_principal}
                </Badge>
            )
        },
        {
            header: 'Estado',
            render: (row) => {
                const map = {
                    PAGADA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                };
                return (
                    <Badge className={`capitalize ${map[row.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {row.estado.toLowerCase()}
                    </Badge>
                );
            }
        }
    ];

    const openCancelModal = (row) => {
        setVentaCancel(row);
        setSupervisorUser('');
        setSupervisorCode('');
        setCancelMotivo('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Historial de Ventas
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Consulta y cancelación de tickets emitidos
                        </p>
                    </div>
                    <Link href="/pos/terminal">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                            <Terminal className="mr-2 h-4 w-4" />
                            Ir a Terminal
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <DataTable
                        data={ventas}
                        columns={columns}
                        loading={loading}
                        onSearch={setSearch}
                        actions={{
                            custom: [
                                {
                                    icon: Printer,
                                    label: 'Imprimir',
                                    onClick: (row) => toast.info("Imprimiendo Ticket " + row.folio),
                                    tooltip: 'Imprimir Ticket'
                                },
                                {
                                    icon: FileText,
                                    label: 'Factura PDF',
                                    onClick: (row) => {
                                        if (row.factura_id) {
                                            window.open(`/api/contabilidad/facturas/${row.factura_id}/pdf/`, '_blank');
                                        } else {
                                            toast.warning("Esta venta no tiene factura timbrada vinculada.");
                                        }
                                    },
                                    tooltip: 'Descargar Factura PDF',
                                    show: (row) => !!row.factura_id
                                },
                                {
                                    icon: XCircle,
                                    label: 'Cancelar',
                                    onClick: openCancelModal,
                                    tooltip: 'Cancelar Venta'
                                }
                            ]
                        }}
                        pagination={{
                            currentPage: page,
                            totalCount: totalItems,
                            pageSize: pageSize,
                            onPageChange: setPage
                        }}
                        emptyMessage="No hay ventas registradas"
                    />
                </div>
            </div>

            <Dialog open={!!ventaCancel} onOpenChange={(open) => !open && setVentaCancel(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex gap-2 items-center text-destructive">
                            <XCircle className="w-5 h-5" />
                            Autorización de Cancelación
                        </DialogTitle>
                        <DialogDescription>
                            Para cancelar la venta <span className="font-mono font-bold text-foreground">{ventaCancel?.folio}</span>, se requiere validación de supervisor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="supervisor">Usuario Supervisor</Label>
                            <Input id="supervisor" value={supervisorUser} onChange={e => setSupervisorUser(e.target.value)} placeholder="ej. admin" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Código TOTP</Label>
                            <Input id="code" value={supervisorCode} onChange={e => setSupervisorCode(e.target.value)} placeholder="000000" maxLength={6} className="font-mono tracking-widest text-center text-lg" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="motivo">Motivo</Label>
                            <Input id="motivo" value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} placeholder="Razón de cancelación..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setVentaCancel(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleCancelar} disabled={cancelLoading}>
                            {cancelLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>) : ('Confirmar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
