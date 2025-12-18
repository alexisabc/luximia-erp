'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    XCircle, Printer, Terminal
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

import { getVentas, cancelarVenta } from '@/services/pos';
import ReusableTable from '@/components/tables/ReusableTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";

export default function HistorialVentasPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [ventas, setVentas] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState('');

    // Cancelación Modal
    const [ventaCancel, setVentaCancel] = useState(null);
    const [supervisorUser, setSupervisorUser] = useState('');
    const [supervisorCode, setSupervisorCode] = useState('');
    const [cancelMotivo, setCancelMotivo] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

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
        { header: 'Folio', accessorKey: 'folio', className: 'font-mono font-bold text-gray-900 dark:text-gray-100' },
        {
            header: 'Fecha',
            accessorKey: 'fecha',
            cell: r => moment(r.fecha).format('DD/MM/YYYY HH:mm')
        },
        { header: 'Cliente', accessorKey: 'cliente_nombre', className: 'font-medium' },
        { header: 'Cajero', accessorKey: 'cajero_nombre' },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: r => <span className="font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(r.total).toFixed(2)}</span>
        },
        {
            header: 'Método',
            accessorKey: 'metodo_pago_principal',
            cell: r => (
                <Badge variant="outline" className="text-xs font-normal">
                    {r.metodo_pago_principal}
                </Badge>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: r => {
                const map = {
                    PAGADA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
                    CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
                    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                };
                return (
                    <Badge variant="outline" className={`capitalize border ${map[r.estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {r.estado.toLowerCase()}
                    </Badge>
                );
            }
        },
    ];

    const openCancelModal = (row) => {
        setVentaCancel(row);
        setSupervisorUser('');
        setSupervisorCode('');
        setCancelMotivo('');
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Historial de Ventas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Consulta y cancelación de tickets emitidos.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/pos/terminal">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0">
                            <Terminal className="mr-2 h-4 w-4" />
                            Ir a Terminal
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
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
                                icon: XCircle,
                                label: 'Cancelar',
                                onClick: openCancelModal,
                                tooltip: 'Cancelar Venta',
                            }
                        ]
                    }}
                    pagination={{
                        currentPage: page,
                        totalCount: totalItems,
                        pageSize: pageSize,
                        onPageChange: setPage
                    }}
                />
            </div>

            {/* Modal Cancelación */}
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
                            <label className="text-sm font-medium leading-none pb-2">Usuario Supervisor</label>
                            <Input
                                value={supervisorUser}
                                onChange={e => setSupervisorUser(e.target.value)}
                                placeholder="ej. admin"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none pb-2">Código TOTP</label>
                            <Input
                                value={supervisorCode}
                                onChange={e => setSupervisorCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="font-mono tracking-widest text-center text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none pb-2">Motivo</label>
                            <Input
                                value={supervisorCode}
                                onChange={e => setCancelMotivo(e.target.value)}
                                placeholder="Razón de cancelación..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setVentaCancel(null)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelar}
                            disabled={cancelLoading}
                        >
                            {cancelLoading ? "Procesando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
