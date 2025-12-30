'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Receipt, Plus, Loader2, CheckCircle, XCircle,
    Clock, DollarSign, FileText, AlertTriangle
} from 'lucide-react';
import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    getEgresos,
    createEgreso,
    autorizarEgreso,
    pagarEgreso,
    cancelarEgreso
} from '@/services/treasury';
import apiClient from '@/services/api';

export default function EgresosPage() {
    const [egresos, setEgresos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cuentas, setCuentas] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('');

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        loadData();
        loadCuentas();
    }, [filtroEstado]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = filtroEstado ? { estado: filtroEstado } : {};
            const res = await getEgresos(params);
            setEgresos(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando egresos");
        } finally {
            setLoading(false);
        }
    };

    const loadCuentas = async () => {
        try {
            const res = await apiClient.get('/tesoreria/cuentas-bancarias/', { params: { activa: true } });
            setCuentas(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data) => {
        try {
            await createEgreso(data);
            toast.success("Egreso creado correctamente");
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error creando el egreso");
        }
    };

    const handleAutorizar = async (egreso) => {
        try {
            await autorizarEgreso(egreso.id);
            toast.success("Egreso autorizado correctamente");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error autorizando el egreso");
        }
    };

    const handlePagar = async (egreso) => {
        try {
            const res = await pagarEgreso(egreso.id);
            toast.success(`Pago realizado. Nuevo saldo: $${res.data.nuevo_saldo_cuenta}`);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error realizando el pago");
        }
    };

    const handleCancelar = async (egreso) => {
        if (!confirm('¿Estás seguro de cancelar este egreso?')) return;

        try {
            await cancelarEgreso(egreso.id);
            toast.success("Egreso cancelado");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error cancelando el egreso");
        }
    };

    // Estadísticas
    const stats = {
        total: egresos.length,
        borradores: egresos.filter(e => e.estado === 'BORRADOR').length,
        autorizados: egresos.filter(e => e.estado === 'AUTORIZADO').length,
        pagados: egresos.filter(e => e.estado === 'PAGADO').length,
        montoTotal: egresos.filter(e => e.estado === 'PAGADO').reduce((sum, e) => sum + parseFloat(e.monto || 0), 0)
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'BORRADOR': { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', icon: FileText },
            'AUTORIZADO': { color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', icon: CheckCircle },
            'PAGADO': { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', icon: CheckCircle },
            'CANCELADO': { color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200', icon: XCircle }
        };

        const badge = badges[estado] || badges['BORRADOR'];
        const Icon = badge.icon;

        return (
            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {estado}
            </span>
        );
    };

    const columns = [
        {
            header: 'Folio',
            accessorKey: 'folio',
            cell: (row) => <span className="font-mono font-bold text-blue-600">{row.folio}</span>
        },
        {
            header: 'Fecha',
            accessorKey: 'fecha',
            cell: (row) => new Date(row.fecha).toLocaleDateString('es-MX')
        },
        {
            header: 'Beneficiario',
            accessorKey: 'beneficiario',
            cell: (row) => (
                <div>
                    <div className="font-semibold">{row.beneficiario}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{row.concepto}</div>
                </div>
            )
        },
        {
            header: 'Cuenta',
            accessorKey: 'cuenta_bancaria_data',
            cell: (row) => (
                <div className="text-sm">
                    <div>{row.cuenta_bancaria_data?.banco_data?.nombre_corto}</div>
                    <div className="text-xs text-gray-500 font-mono">{row.cuenta_bancaria_data?.numero_cuenta}</div>
                </div>
            )
        },
        {
            header: 'Tipo',
            accessorKey: 'tipo',
            cell: (row) => (
                <span className="px-2 py-1 text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    {row.tipo}
                </span>
            )
        },
        {
            header: 'Monto',
            accessorKey: 'monto',
            cell: (row) => (
                <div className="text-right font-bold text-lg text-green-600 dark:text-green-400">
                    ${parseFloat(row.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => getEstadoBadge(row.estado)
        },
        {
            header: 'Solicitado por',
            accessorKey: 'solicitado_por_nombre',
            cell: (row) => (
                <div className="text-sm">
                    <div>{row.solicitado_por_nombre}</div>
                    {row.autorizado_por_nombre && (
                        <div className="text-xs text-green-600">✓ {row.autorizado_por_nombre}</div>
                    )}
                </div>
            )
        }
    ];

    const getCustomActions = (row) => {
        const actions = [];

        if (row.estado === 'BORRADOR') {
            actions.push({
                label: 'Autorizar',
                icon: CheckCircle,
                onClick: () => handleAutorizar(row),
                className: 'text-blue-600 hover:text-blue-700'
            });
            actions.push({
                label: 'Cancelar',
                icon: XCircle,
                onClick: () => handleCancelar(row),
                className: 'text-red-600 hover:text-red-700'
            });
        }

        if (row.estado === 'AUTORIZADO') {
            actions.push({
                label: 'Pagar',
                icon: DollarSign,
                onClick: () => handlePagar(row),
                className: 'text-green-600 hover:text-green-700'
            });
            actions.push({
                label: 'Cancelar',
                icon: XCircle,
                onClick: () => handleCancelar(row),
                className: 'text-red-600 hover:text-red-700'
            });
        }

        return actions;
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 flex items-center gap-3">
                        <Receipt className="text-green-600 w-8 h-8" />
                        Egresos
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestión de pagos y egresos con flujo de autorización
                    </p>
                </div>

                <ActionButtonGroup
                    canCreate={true}
                    onCreate={() => { reset(); setIsModalOpen(true); }}
                    canImport={false}
                    canExport={false}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-100 text-sm">Total</p>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </div>
                        <Receipt className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">Borradores</p>
                            <p className="text-3xl font-bold">{stats.borradores}</p>
                        </div>
                        <Clock className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Autorizados</p>
                            <p className="text-3xl font-bold">{stats.autorizados}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Pagados</p>
                            <p className="text-3xl font-bold">{stats.pagados}</p>
                        </div>
                        <DollarSign className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Monto Total</p>
                            <p className="text-xl font-bold">${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                        </div>
                        <DollarSign className="w-12 h-12 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                <Button
                    variant={filtroEstado === '' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('')}
                    size="sm"
                >
                    Todos
                </Button>
                <Button
                    variant={filtroEstado === 'BORRADOR' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('BORRADOR')}
                    size="sm"
                >
                    Borradores
                </Button>
                <Button
                    variant={filtroEstado === 'AUTORIZADO' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('AUTORIZADO')}
                    size="sm"
                >
                    Autorizados
                </Button>
                <Button
                    variant={filtroEstado === 'PAGADO' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('PAGADO')}
                    size="sm"
                >
                    Pagados
                </Button>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <DataTable
                    data={egresos}
                    columns={columns}
                    loading={loading}
                    actions={{
                        customActions: getCustomActions
                    }}
                    emptyMessage="No hay egresos registrados."
                />
            </div>

            {/* Modal Crear Egreso */}
            <Modal
                title="Nuevo Egreso"
                description="Registra un nuevo egreso o pago"
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); reset(); }}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>Cuenta Bancaria *</Label>
                        <Controller
                            name="cuenta_bancaria"
                            control={control}
                            rules={{ required: 'Selecciona una cuenta' }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cuentas.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.banco_data?.nombre_corto} - {c.numero_cuenta}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.cuenta_bancaria && <span className="text-red-500 text-xs">{errors.cuenta_bancaria.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha *</Label>
                            <Input type="date" {...register('fecha', { required: 'Requerido' })} />
                            {errors.fecha && <span className="text-red-500 text-xs">{errors.fecha.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Controller
                                name="tipo"
                                control={control}
                                rules={{ required: 'Selecciona un tipo' }}
                                defaultValue="TRANSFERENCIA"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                            <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.tipo && <span className="text-red-500 text-xs">{errors.tipo.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Beneficiario *</Label>
                        <Input {...register('beneficiario', { required: 'Requerido' })} placeholder="Nombre del beneficiario" />
                        {errors.beneficiario && <span className="text-red-500 text-xs">{errors.beneficiario.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Concepto *</Label>
                        <Textarea {...register('concepto', { required: 'Requerido' })} placeholder="Descripción del pago" rows={3} />
                        {errors.concepto && <span className="text-red-500 text-xs">{errors.concepto.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monto *</Label>
                            <Input type="number" step="0.01" {...register('monto', { required: 'Requerido', min: 0.01 })} placeholder="0.00" />
                            {errors.monto && <span className="text-red-500 text-xs">{errors.monto.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Referencia</Label>
                            <Input {...register('referencia')} placeholder="Número de cheque o referencia" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Egreso
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
