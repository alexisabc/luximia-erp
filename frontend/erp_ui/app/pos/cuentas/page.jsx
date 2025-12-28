'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    DollarSign, Users, TrendingUp, AlertCircle,
    CreditCard, Loader2
} from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { getCuentasClientes, abonarCuenta, getTurnoActivo } from '@/services/pos';
import { useAuth } from '@/context/AuthContext';

export default function PosCuentasPage() {
    const { hasPermission } = useAuth();
    const router = useRouter();
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [isAbonoOpen, setIsAbonoOpen] = useState(false);
    const [abonoData, setAbonoData] = useState({ monto: '', forma_pago: 'EFECTIVO', comentarios: '' });
    const [selectedCuenta, setSelectedCuenta] = useState(null);
    const [activeTurno, setActiveTurno] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stats = [
        {
            label: 'Total Clientes',
            value: data.count || 0,
            icon: Users,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Con Crédito',
            value: data.results?.filter(c => parseFloat(c.limite_credito) > 0).length || 0,
            icon: CreditCard,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Con Deuda',
            value: data.results?.filter(c => parseFloat(c.saldo) < 0).length || 0,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Saldo Total',
            value: data.results?.length > 0
                ? `$${data.results.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0).toFixed(2)}`
                : '$0.00',
            icon: DollarSign,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            isAmount: true
        }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCuentasClientes(page, pageSize, search);
            setData(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar cuentas");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        fetchData();
        getTurnoActivo().then(t => setActiveTurno(t)).catch(() => setActiveTurno(null));
    }, [fetchData]);

    const handleAbonoSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCuenta) return;

        if (abonoData.forma_pago === 'EFECTIVO' && !activeTurno) {
            toast.error("No hay un turno abierto para recibir efectivo");
            return;
        }

        setIsSubmitting(true);
        try {
            await abonarCuenta({
                cliente_id: selectedCuenta.cliente,
                monto: abonoData.monto,
                forma_pago: abonoData.forma_pago,
                comentarios: abonoData.comentarios,
                turno_id: activeTurno?.id || 0
            });
            toast.success("Abono registrado exitosamente");
            setIsAbonoOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar abono");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAbono = (row) => {
        setSelectedCuenta(row);
        setAbonoData({ monto: '', forma_pago: 'EFECTIVO', comentarios: '' });
        setIsAbonoOpen(true);
    };

    const columns = [
        {
            header: 'Cliente',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                        {row.nombre_cliente?.charAt(0) || 'C'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.nombre_cliente}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Límite: ${Number(row.limite_credito).toFixed(2)}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Saldo Actual',
            render: (row) => {
                const val = Number(row.saldo);
                return (
                    <span className={`font-bold ${val < 0 ? 'text-red-500' : val > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                        ${val.toFixed(2)}
                    </span>
                );
            }
        },
        {
            header: 'Disponible',
            render: (row) => (
                <span className="font-mono text-gray-700 dark:text-gray-300">
                    ${Number(row.credito_disponible).toFixed(2)}
                </span>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Cuentas por Cobrar
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Gestión de saldos, créditos y anticipos de clientes
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTurno && (
                            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white dark:bg-gray-800 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Turno Activo: #{activeTurno.id}
                            </Badge>
                        )}
                        <Button onClick={() => router.push('/contabilidad/clientes')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                            <Users className="mr-2 h-4 w-4" />
                            Gestionar Clientes
                        </Button>
                    </div>
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
                    <ReusableTable
                        data={data.results}
                        columns={columns}
                        loading={loading}
                        onSearch={setSearch}
                        actions={{
                            custom: [
                                {
                                    icon: DollarSign,
                                    label: 'Abonar',
                                    onClick: openAbono,
                                    tooltip: 'Registrar Pago o Anticipo'
                                }
                            ]
                        }}
                        pagination={{ currentPage: page, totalCount: data.count, pageSize: pageSize, onPageChange: setPage }}
                        emptyMessage="No hay cuentas por cobrar"
                    />
                </div>
            </div>

            <ReusableModal isOpen={isAbonoOpen} onClose={() => setIsAbonoOpen(false)} title={`Registrar Abono - ${selectedCuenta?.nombre_cliente}`} size="md">
                <form onSubmit={handleAbonoSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="monto">Monto a Abonar ($) <span className="text-red-500">*</span></Label>
                        <Input id="monto" type="number" step="0.01" value={abonoData.monto} onChange={(e) => setAbonoData({ ...abonoData, monto: e.target.value })} placeholder="0.00" required className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="forma_pago">Forma de Pago <span className="text-red-500">*</span></Label>
                        <Select value={abonoData.forma_pago} onValueChange={(value) => setAbonoData({ ...abonoData, forma_pago: value })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="comentarios">Comentarios / Referencia</Label>
                        <Textarea id="comentarios" value={abonoData.comentarios} onChange={(e) => setAbonoData({ ...abonoData, comentarios: e.target.value })} placeholder="Información adicional..." rows={3} className="mt-1" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsAbonoOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>) : ('Registrar Pago')}
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
