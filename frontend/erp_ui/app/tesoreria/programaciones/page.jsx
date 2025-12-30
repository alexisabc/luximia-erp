'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Calendar, Plus, Loader2, CheckCircle, FileDown,
    Clock, DollarSign, Building2
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
    getProgramacionesPago,
    createProgramacionPago,
    autorizarProgramacion,
    generarLayoutPago
} from '@/services/treasury';
import apiClient from '@/services/api';

export default function ProgramacionesPagoPage() {
    const [programaciones, setProgramaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bancos, setBancos] = useState([]);

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        loadData();
        loadBancos();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getProgramacionesPago();
            setProgramaciones(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando programaciones");
        } finally {
            setLoading(false);
        }
    };

    const loadBancos = async () => {
        try {
            const res = await apiClient.get('/contabilidad/bancos/');
            setBancos(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data) => {
        try {
            await createProgramacionPago(data);
            toast.success("Programación creada correctamente");
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error creando la programación");
        }
    };

    const handleAutorizar = async (prog) => {
        try {
            await autorizarProgramacion(prog.id);
            toast.success("Programación autorizada correctamente");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error autorizando la programación");
        }
    };

    const handleGenerarLayout = async (prog) => {
        try {
            const res = await generarLayoutPago(prog.id);
            toast.success(res.data.detail || "Layout generado correctamente");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error generando el layout");
        }
    };

    const stats = {
        total: programaciones.length,
        borradores: programaciones.filter(p => p.estado === 'BORRADOR').length,
        autorizadas: programaciones.filter(p => p.estado === 'AUTORIZADA').length,
        procesadas: programaciones.filter(p => p.estado === 'PROCESADA').length,
        montoTotal: programaciones.reduce((sum, p) => sum + parseFloat(p.total_mxn || 0), 0)
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'BORRADOR': { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', icon: Clock },
            'AUTORIZADA': { color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', icon: CheckCircle },
            'PROCESADA': { color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', icon: FileDown },
            'PAGADA': { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', icon: CheckCircle }
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
            header: 'ID',
            accessorKey: 'id',
            cell: (row) => <span className="font-mono font-bold text-blue-600">#{row.id}</span>
        },
        {
            header: 'Fecha Programada',
            accessorKey: 'fecha_programada',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">{new Date(row.fecha_programada).toLocaleDateString('es-MX', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}</span>
                </div>
            )
        },
        {
            header: 'Descripción',
            accessorKey: 'descripcion',
            cell: (row) => (
                <div>
                    <div className="font-semibold">{row.descripcion}</div>
                    <div className="text-xs text-gray-500">
                        {row.banco_data?.nombre_corto} - {row.cuenta_emisora}
                    </div>
                </div>
            )
        },
        {
            header: 'Total MXN',
            accessorKey: 'total_mxn',
            cell: (row) => (
                <div className="text-right">
                    <div className="font-bold text-lg text-green-600 dark:text-green-400">
                        ${parseFloat(row.total_mxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">MXN</div>
                </div>
            )
        },
        {
            header: 'Total USD',
            accessorKey: 'total_usd',
            cell: (row) => {
                const totalUsd = parseFloat(row.total_usd || 0);
                if (totalUsd === 0) return <span className="text-gray-400">-</span>;

                return (
                    <div className="text-right">
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                            ${totalUsd.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">USD</div>
                    </div>
                );
            }
        },
        {
            header: 'Autorizado Por',
            accessorKey: 'autorizado_por',
            cell: (row) => (
                <div className="text-sm">
                    {row.autorizado_por ? (
                        <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>{row.autorizado_por.first_name} {row.autorizado_por.last_name}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400">Pendiente</span>
                    )}
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => getEstadoBadge(row.estado)
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
        }

        if (row.estado === 'AUTORIZADA') {
            actions.push({
                label: 'Generar Layout',
                icon: FileDown,
                onClick: () => handleGenerarLayout(row),
                className: 'text-purple-600 hover:text-purple-700'
            });
        }

        return actions;
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 flex items-center gap-3">
                        <Calendar className="text-purple-600 w-8 h-8" />
                        Programaciones de Pago
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Lotes de pagos programados y dispersión bancaria
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
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total</p>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </div>
                        <Calendar className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-100 text-sm">Borradores</p>
                            <p className="text-3xl font-bold">{stats.borradores}</p>
                        </div>
                        <Clock className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Autorizadas</p>
                            <p className="text-3xl font-bold">{stats.autorizadas}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm">Procesadas</p>
                            <p className="text-3xl font-bold">{stats.procesadas}</p>
                        </div>
                        <FileDown className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Monto Total</p>
                            <p className="text-xl font-bold">${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                        </div>
                        <DollarSign className="w-12 h-12 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <DataTable
                    data={programaciones}
                    columns={columns}
                    loading={loading}
                    actions={{
                        customActions: getCustomActions
                    }}
                    emptyMessage="No hay programaciones de pago registradas."
                />
            </div>

            {/* Modal Crear Programación */}
            <Modal
                title="Nueva Programación de Pago"
                description="Crea un lote de pagos para dispersión"
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); reset(); }}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>Fecha Programada *</Label>
                        <Input type="date" {...register('fecha_programada', { required: 'Requerido' })} />
                        {errors.fecha_programada && <span className="text-red-500 text-xs">{errors.fecha_programada.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Input {...register('descripcion', { required: 'Requerido' })} placeholder="Ej: Pago Quincenal Proveedores" />
                        {errors.descripcion && <span className="text-red-500 text-xs">{errors.descripcion.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Banco Emisor *</Label>
                            <Controller
                                name="banco_emisor"
                                control={control}
                                rules={{ required: 'Selecciona un banco' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bancos.map(b => (
                                                <SelectItem key={b.id} value={b.id.toString()}>
                                                    {b.nombre_corto}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.banco_emisor && <span className="text-red-500 text-xs">{errors.banco_emisor.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Cuenta Emisora *</Label>
                            <Input {...register('cuenta_emisora', { required: 'Requerido' })} placeholder="Número de cuenta" />
                            {errors.cuenta_emisora && <span className="text-red-500 text-xs">{errors.cuenta_emisora.message}</span>}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Nota:</strong> Después de crear la programación, podrás agregar los contrarecibos que deseas incluir en este lote de pago.
                        </p>
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Programación
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
