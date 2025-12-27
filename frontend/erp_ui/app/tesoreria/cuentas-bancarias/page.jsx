'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Building2, Plus, Loader2, TrendingUp, TrendingDown,
    AlertCircle, DollarSign, RefreshCw
} from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    getCuentasBancarias,
    createCuentaBancaria,
    updateCuentaBancaria,
    conciliarCuenta
} from '@/services/treasury';
import apiClient from '@/services/api';

export default function CuentasBancariasPage() {
    const [cuentas, setCuentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConciliarModalOpen, setIsConciliarModalOpen] = useState(false);
    const [selectedCuenta, setSelectedCuenta] = useState(null);
    const [bancos, setBancos] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [empresas, setEmpresas] = useState([]);

    const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } = useForm();
    const { register: registerConciliar, handleSubmit: handleSubmitConciliar, reset: resetConciliar, formState: { errors: errorsConciliar, isSubmitting: isSubmittingConciliar } } = useForm();

    useEffect(() => {
        loadData();
        loadCatalogos();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getCuentasBancarias();
            setCuentas(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando cuentas bancarias");
        } finally {
            setLoading(false);
        }
    };

    const loadCatalogos = async () => {
        try {
            const [bancosRes, monedasRes, empresasRes] = await Promise.all([
                apiClient.get('/contabilidad/bancos/'),
                apiClient.get('/contabilidad/monedas/'),
                apiClient.get('/core/empresas/')
            ]);
            setBancos(bancosRes.data.results || bancosRes.data);
            setMonedas(monedasRes.data.results || monedasRes.data);
            setEmpresas(empresasRes.data.results || empresasRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando catálogos");
        }
    };

    const onSubmit = async (data) => {
        try {
            if (selectedCuenta) {
                await updateCuentaBancaria(selectedCuenta.id, data);
                toast.success("Cuenta actualizada correctamente");
            } else {
                await createCuentaBancaria(data);
                toast.success("Cuenta creada correctamente");
            }
            setIsModalOpen(false);
            reset();
            setSelectedCuenta(null);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error guardando la cuenta");
        }
    };

    const handleEdit = (cuenta) => {
        setSelectedCuenta(cuenta);
        setValue('banco', cuenta.banco);
        setValue('empresa', cuenta.empresa);
        setValue('numero_cuenta', cuenta.numero_cuenta);
        setValue('clabe', cuenta.clabe);
        setValue('tipo_cuenta', cuenta.tipo_cuenta);
        setValue('moneda', cuenta.moneda);
        setValue('saldo_actual', cuenta.saldo_actual);
        setValue('saldo_bancario', cuenta.saldo_bancario);
        setValue('es_principal', cuenta.es_principal);
        setValue('activa', cuenta.activa);
        setIsModalOpen(true);
    };

    const handleConciliar = (cuenta) => {
        setSelectedCuenta(cuenta);
        resetConciliar({ saldo_bancario: cuenta.saldo_bancario });
        setIsConciliarModalOpen(true);
    };

    const onSubmitConciliar = async (data) => {
        try {
            const res = await conciliarCuenta(selectedCuenta.id, data.saldo_bancario);
            toast.success(`Conciliación completada. Diferencia: $${res.data.diferencia}`);
            setIsConciliarModalOpen(false);
            resetConciliar();
            setSelectedCuenta(null);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error en la conciliación");
        }
    };

    // Calcular estadísticas
    const stats = {
        totalCuentas: cuentas.length,
        saldoTotal: cuentas.reduce((sum, c) => sum + parseFloat(c.saldo_actual || 0), 0),
        diferenciasTotal: cuentas.reduce((sum, c) => sum + Math.abs(parseFloat(c.diferencia || 0)), 0),
        cuentasActivas: cuentas.filter(c => c.activa).length
    };

    const columns = [
        {
            header: 'Banco',
            accessorKey: 'banco_data',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">{row.banco_data?.nombre_corto || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Cuenta',
            accessorKey: 'numero_cuenta',
            cell: (row) => (
                <div>
                    <div className="font-mono text-sm">{row.numero_cuenta}</div>
                    {row.clabe && <div className="text-xs text-gray-500">CLABE: {row.clabe}</div>}
                </div>
            )
        },
        {
            header: 'Tipo',
            accessorKey: 'tipo_cuenta',
            cell: (row) => (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {row.tipo_cuenta}
                </span>
            )
        },
        {
            header: 'Saldo Sistema',
            accessorKey: 'saldo_actual',
            cell: (row) => (
                <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                        ${parseFloat(row.saldo_actual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">{row.moneda_data?.codigo || 'MXN'}</div>
                </div>
            )
        },
        {
            header: 'Saldo Banco',
            accessorKey: 'saldo_bancario',
            cell: (row) => (
                <div className="text-right font-mono text-sm">
                    ${parseFloat(row.saldo_bancario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            header: 'Diferencia',
            accessorKey: 'diferencia',
            cell: (row) => {
                const diff = parseFloat(row.diferencia || 0);
                const isPositive = diff > 0;
                const isZero = diff === 0;

                return (
                    <div className={`text-right font-bold flex items-center justify-end gap-1 ${isZero ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {!isZero && (isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
                        ${Math.abs(diff).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                );
            }
        },
        {
            header: 'Estado',
            accessorKey: 'activa',
            cell: (row) => (
                <span className={`px-2 py-1 text-xs rounded-full ${row.activa
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                    {row.activa ? 'Activa' : 'Inactiva'}
                </span>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <Building2 className="text-blue-600 w-8 h-8" />
                        Cuentas Bancarias
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestión y conciliación de cuentas bancarias
                    </p>
                </div>

                <ActionButtons
                    canCreate={true}
                    onCreate={() => { reset(); setSelectedCuenta(null); setIsModalOpen(true); }}
                    canImport={false}
                    canExport={false}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Cuentas</p>
                            <p className="text-3xl font-bold">{stats.totalCuentas}</p>
                        </div>
                        <Building2 className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Saldo Total</p>
                            <p className="text-2xl font-bold">${stats.saldoTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                        </div>
                        <DollarSign className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Diferencias</p>
                            <p className="text-2xl font-bold">${stats.diferenciasTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                        </div>
                        <AlertCircle className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Activas</p>
                            <p className="text-3xl font-bold">{stats.cuentasActivas}</p>
                        </div>
                        <RefreshCw className="w-12 h-12 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={cuentas}
                    columns={columns}
                    loading={loading}
                    actions={{
                        onEdit: handleEdit,
                        customActions: [
                            {
                                label: 'Conciliar',
                                icon: RefreshCw,
                                onClick: handleConciliar,
                                className: 'text-blue-600 hover:text-blue-700'
                            }
                        ]
                    }}
                    emptyMessage="No hay cuentas bancarias registradas."
                />
            </div>

            {/* Modal Crear/Editar */}
            <ReusableModal
                title={selectedCuenta ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
                description="Ingresa los datos de la cuenta bancaria"
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedCuenta(null); reset(); }}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Banco *</Label>
                            <Controller
                                name="banco"
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
                            {errors.banco && <span className="text-red-500 text-xs">{errors.banco.message}</span>}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Número de Cuenta *</Label>
                            <Input {...register('numero_cuenta', { required: 'Requerido' })} placeholder="0123456789" />
                            {errors.numero_cuenta && <span className="text-red-500 text-xs">{errors.numero_cuenta.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>CLABE</Label>
                            <Input {...register('clabe')} placeholder="012345678901234567" maxLength={18} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Cuenta *</Label>
                            <Controller
                                name="tipo_cuenta"
                                control={control}
                                rules={{ required: 'Selecciona un tipo' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHEQUES">Cheques</SelectItem>
                                            <SelectItem value="INVERSION">Inversión</SelectItem>
                                            <SelectItem value="NOMINA">Nómina</SelectItem>
                                            <SelectItem value="AHORRO">Ahorro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.tipo_cuenta && <span className="text-red-500 text-xs">{errors.tipo_cuenta.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Moneda *</Label>
                            <Controller
                                name="moneda"
                                control={control}
                                rules={{ required: 'Selecciona una moneda' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monedas.map(m => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.codigo} - {m.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.moneda && <span className="text-red-500 text-xs">{errors.moneda.message}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Saldo Actual</Label>
                            <Input type="number" step="0.01" {...register('saldo_actual')} placeholder="0.00" />
                        </div>

                        <div className="space-y-2">
                            <Label>Saldo Bancario</Label>
                            <Input type="number" step="0.01" {...register('saldo_bancario')} placeholder="0.00" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="es_principal"
                                control={control}
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label>Cuenta Principal</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Controller
                                name="activa"
                                control={control}
                                defaultValue={true}
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label>Activa</Label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedCuenta ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal Conciliar */}
            <ReusableModal
                title="Conciliar Cuenta Bancaria"
                description={`Actualiza el saldo bancario de ${selectedCuenta?.banco_data?.nombre_corto || ''} - ${selectedCuenta?.numero_cuenta || ''}`}
                isOpen={isConciliarModalOpen}
                onClose={() => { setIsConciliarModalOpen(false); setSelectedCuenta(null); resetConciliar(); }}
            >
                <form onSubmit={handleSubmitConciliar(onSubmitConciliar)} className="space-y-4 px-1">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Sistema:</span>
                            <span className="font-bold text-green-600">${parseFloat(selectedCuenta?.saldo_actual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Bancario Actual:</span>
                            <span className="font-mono">${parseFloat(selectedCuenta?.saldo_bancario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nuevo Saldo Bancario *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            {...registerConciliar('saldo_bancario', { required: 'Requerido' })}
                            placeholder="0.00"
                            className="text-lg font-mono"
                        />
                        {errorsConciliar.saldo_bancario && <span className="text-red-500 text-xs">{errorsConciliar.saldo_bancario.message}</span>}
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsConciliarModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmittingConciliar} className="bg-green-600 hover:bg-green-700">
                            {isSubmittingConciliar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Conciliar
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
