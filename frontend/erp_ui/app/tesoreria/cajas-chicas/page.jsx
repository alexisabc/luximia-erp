'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Wallet, Plus, Loader2, TrendingDown, TrendingUp,
    Lock, Unlock, DollarSign, Receipt
} from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    getCajasChicas,
    createCajaChica,
    cerrarCaja,
    reembolsarCaja,
    getMovimientosCaja,
    createMovimientoCaja
} from '@/services/treasury';
import apiClient from '@/services/api';

export default function CajasChicasPage() {
    const [cajas, setCajas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
    const [selectedCaja, setSelectedCaja] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm();
    const { register: registerMov, handleSubmit: handleSubmitMov, control: controlMov, reset: resetMov, formState: { errors: errorsMov, isSubmitting: isSubmittingMov } } = useForm();

    useEffect(() => {
        loadData();
        loadCatalogos();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getCajasChicas();
            setCajas(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando cajas chicas");
        } finally {
            setLoading(false);
        }
    };

    const loadCatalogos = async () => {
        try {
            const [usuariosRes, empresasRes] = await Promise.all([
                apiClient.get('/users/'),
                apiClient.get('/core/empresas/')
            ]);
            setUsuarios(usuariosRes.data.results || usuariosRes.data);
            setEmpresas(empresasRes.data.results || empresasRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadMovimientos = async (cajaId) => {
        try {
            const res = await getMovimientosCaja({ caja: cajaId });
            setMovimientos(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data) => {
        try {
            await createCajaChica(data);
            toast.success("Caja chica creada correctamente");
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error creando la caja");
        }
    };

    const onSubmitMovimiento = async (data) => {
        try {
            await createMovimientoCaja({ ...data, caja: selectedCaja.id });
            toast.success("Movimiento registrado correctamente");
            setIsMovimientoModalOpen(false);
            resetMov();
            loadData();
            if (selectedCaja) {
                loadMovimientos(selectedCaja.id);
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error registrando el movimiento");
        }
    };

    const handleCerrar = async (caja) => {
        if (!confirm('¿Estás seguro de cerrar esta caja?')) return;

        try {
            const res = await cerrarCaja(caja.id);
            toast.success(`Caja cerrada. Saldo final: $${res.data.saldo_final}`);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error cerrando la caja");
        }
    };

    const handleReembolsar = async (caja) => {
        if (!confirm('¿Deseas reembolsar esta caja?')) return;

        try {
            const res = await reembolsarCaja(caja.id);
            toast.success(`Caja reembolsada. Monto: $${res.data.monto_reembolsado}`);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error reembolsando la caja");
        }
    };

    const handleVerMovimientos = async (caja) => {
        setSelectedCaja(caja);
        await loadMovimientos(caja.id);
        // Aquí podrías abrir un modal o navegar a otra vista
        toast.info(`Mostrando movimientos de ${caja.nombre}`);
    };

    const handleRegistrarMovimiento = (caja) => {
        setSelectedCaja(caja);
        resetMov();
        setIsMovimientoModalOpen(true);
    };

    const stats = {
        total: cajas.length,
        abiertas: cajas.filter(c => c.estado === 'ABIERTA').length,
        saldoTotal: cajas.filter(c => c.estado === 'ABIERTA').reduce((sum, c) => sum + parseFloat(c.saldo_actual || 0), 0),
        fondoTotal: cajas.reduce((sum, c) => sum + parseFloat(c.monto_fondo || 0), 0)
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'ABIERTA': { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', icon: Unlock },
            'CERRADA': { color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', icon: Lock },
            'REEMBOLSADA': { color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', icon: DollarSign }
        };

        const badge = badges[estado] || badges['ABIERTA'];
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
            header: 'Nombre',
            accessorKey: 'nombre',
            cell: (row) => (
                <div>
                    <div className="font-bold">{row.nombre}</div>
                    <div className="text-xs text-gray-500">{row.responsable_nombre}</div>
                </div>
            )
        },
        {
            header: 'Fondo',
            accessorKey: 'monto_fondo',
            cell: (row) => (
                <div className="text-right font-mono">
                    ${parseFloat(row.monto_fondo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            header: 'Saldo Actual',
            accessorKey: 'saldo_actual',
            cell: (row) => (
                <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                        ${parseFloat(row.saldo_actual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            )
        },
        {
            header: '% Disponible',
            accessorKey: 'porcentaje_uso',
            cell: (row) => {
                const porcentaje = row.porcentaje_uso || 0;
                const color = porcentaje > 50 ? 'text-green-600' : porcentaje > 20 ? 'text-yellow-600' : 'text-red-600';

                return (
                    <div className={`text-right font-bold ${color}`}>
                        {porcentaje.toFixed(1)}%
                    </div>
                );
            }
        },
        {
            header: 'Fechas',
            accessorKey: 'fecha_apertura',
            cell: (row) => (
                <div className="text-sm">
                    <div>Apertura: {new Date(row.fecha_apertura).toLocaleDateString('es-MX')}</div>
                    {row.fecha_cierre && (
                        <div className="text-xs text-gray-500">Cierre: {new Date(row.fecha_cierre).toLocaleDateString('es-MX')}</div>
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
        const actions = [
            {
                label: 'Ver Movimientos',
                icon: Receipt,
                onClick: () => handleVerMovimientos(row),
                className: 'text-blue-600 hover:text-blue-700'
            }
        ];

        if (row.estado === 'ABIERTA') {
            actions.push({
                label: 'Registrar Gasto',
                icon: TrendingDown,
                onClick: () => handleRegistrarMovimiento(row),
                className: 'text-purple-600 hover:text-purple-700'
            });
            actions.push({
                label: 'Cerrar',
                icon: Lock,
                onClick: () => handleCerrar(row),
                className: 'text-orange-600 hover:text-orange-700'
            });
        }

        if (row.estado === 'CERRADA') {
            actions.push({
                label: 'Reembolsar',
                icon: DollarSign,
                onClick: () => handleReembolsar(row),
                className: 'text-green-600 hover:text-green-700'
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
                        <Wallet className="text-purple-600 w-8 h-8" />
                        Cajas Chicas
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestión de fondos de caja chica y gastos menores
                    </p>
                </div>

                <ActionButtons
                    canCreate={true}
                    onCreate={() => { reset(); setIsModalOpen(true); }}
                    canImport={false}
                    canExport={false}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Total Cajas</p>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </div>
                        <Wallet className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Abiertas</p>
                            <p className="text-3xl font-bold">{stats.abiertas}</p>
                        </div>
                        <Unlock className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Saldo Disponible</p>
                            <p className="text-2xl font-bold">${stats.saldoTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                        </div>
                        <DollarSign className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Fondo Total</p>
                            <p className="text-2xl font-bold">${stats.fondoTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={cajas}
                    columns={columns}
                    loading={loading}
                    actions={{
                        customActions: getCustomActions
                    }}
                    emptyMessage="No hay cajas chicas registradas."
                />
            </div>

            {/* Modal Crear Caja */}
            <ReusableModal
                title="Nueva Caja Chica"
                description="Crea un nuevo fondo de caja chica"
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); reset(); }}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input {...register('nombre', { required: 'Requerido' })} placeholder="Ej: Caja Oficina Central" />
                        {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Responsable *</Label>
                            <Controller
                                name="responsable"
                                control={control}
                                rules={{ required: 'Selecciona un responsable' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {usuarios.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.first_name} {u.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.responsable && <span className="text-red-500 text-xs">{errors.responsable.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Empresa *</Label>
                            <Controller
                                name="empresa"
                                control={control}
                                rules={{ required: 'Selecciona una empresa' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empresas.map(e => (
                                                <SelectItem key={e.id} value={e.id.toString()}>
                                                    {e.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.empresa && <span className="text-red-500 text-xs">{errors.empresa.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Monto del Fondo *</Label>
                        <Input type="number" step="0.01" {...register('monto_fondo', { required: 'Requerido', min: 0.01 })} placeholder="5000.00" />
                        {errors.monto_fondo && <span className="text-red-500 text-xs">{errors.monto_fondo.message}</span>}
                        <p className="text-xs text-gray-500">El saldo inicial será igual al monto del fondo</p>
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Caja
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal Registrar Movimiento */}
            <ReusableModal
                title="Registrar Movimiento"
                description={`Registra un gasto o reembolso en ${selectedCaja?.nombre || ''}`}
                isOpen={isMovimientoModalOpen}
                onClose={() => { setIsMovimientoModalOpen(false); setSelectedCaja(null); resetMov(); }}
            >
                <form onSubmit={handleSubmitMov(onSubmitMovimiento)} className="space-y-4 px-1">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Disponible:</span>
                            <span className="font-bold text-green-600">${parseFloat(selectedCaja?.saldo_actual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Controller
                            name="tipo"
                            control={controlMov}
                            rules={{ required: 'Selecciona un tipo' }}
                            defaultValue="GASTO"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GASTO">Gasto</SelectItem>
                                        <SelectItem value="REEMBOLSO">Reembolso</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errorsMov.tipo && <span className="text-red-500 text-xs">{errorsMov.tipo.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Concepto *</Label>
                        <Textarea {...registerMov('concepto', { required: 'Requerido' })} placeholder="Descripción del gasto" rows={2} />
                        {errorsMov.concepto && <span className="text-red-500 text-xs">{errorsMov.concepto.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monto *</Label>
                            <Input type="number" step="0.01" {...registerMov('monto', { required: 'Requerido', min: 0.01 })} placeholder="0.00" />
                            {errorsMov.monto && <span className="text-red-500 text-xs">{errorsMov.monto.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Beneficiario</Label>
                            <Input {...registerMov('beneficiario')} placeholder="Nombre del beneficiario" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsMovimientoModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmittingMov} className="bg-purple-600 hover:bg-purple-700">
                            {isSubmittingMov && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrar
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
