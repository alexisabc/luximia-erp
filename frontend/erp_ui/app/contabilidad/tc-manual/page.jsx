'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Banknote, Loader2, TrendingUp, Calendar,
    DollarSign, AlertCircle
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import apiClient from '@/services/api';

export default function TiposCambioManualPage() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [monedas, setMonedas] = useState([]);

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm();

    const stats = [
        {
            label: 'Total Registros',
            value: rates.length || 0,
            icon: Banknote,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Este Mes',
            value: rates.filter(r => {
                const fecha = new Date(r.fecha);
                const hoy = new Date();
                return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
            }).length || 0,
            icon: Calendar,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'TC Promedio',
            value: rates.length > 0
                ? `$${(rates.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0) / rates.length).toFixed(4)}`
                : '$0.0000',
            icon: TrendingUp,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            isAmount: true
        },
        {
            label: 'Monedas',
            value: new Set(rates.map(r => r.moneda_origen?.codigo)).size || 0,
            icon: DollarSign,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    useEffect(() => {
        loadData();
        loadMonedas();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/contabilidad/tipos-cambio-manual/');
            setRates(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando tipos de cambio");
        } finally {
            setLoading(false);
        }
    };

    const loadMonedas = async () => {
        try {
            const res = await apiClient.get('/contabilidad/monedas/');
            setMonedas(res.data.results || res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                escenario: "PACTADO",
                fecha: data.fecha,
                valor: data.valor,
                moneda_origen_id: data.moneda
            };
            await apiClient.post('/contabilidad/tipos-cambio-manual/', payload);
            toast.success("Tipo de cambio guardado correctamente");
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error guardando el tipo de cambio");
        }
    };

    const columns = [
        {
            header: 'Tipo de Cambio',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-lg">
                            ${parseFloat(row.valor).toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.moneda_origen?.codigo || 'USD'} → {row.moneda_destino?.codigo || 'MXN'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Fecha',
            render: (row) => (
                <div className="text-sm">
                    <div className="text-gray-900 dark:text-gray-100 font-medium">{row.fecha}</div>
                    <div className="text-gray-500 dark:text-gray-400">Escenario: {row.escenario || 'PACTADO'}</div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Banknote className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                            Tipos de Cambio Manuales
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Registro manual de tipos de cambio pactados
                        </p>
                    </div>
                    <ActionButtonGroup onCreate={() => setIsModalOpen(true)} canCreate={true} />
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
                    <DataTable data={rates} columns={columns} loading={loading} emptyMessage="No hay tipos de cambio registrados" />
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Tipo de Cambio" size="md">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
                        <Input id="fecha" type="date" {...register('fecha', { required: true })} className="mt-1" />
                        {errors.fecha && <span className="text-red-500 text-sm">Este campo es requerido</span>}
                    </div>
                    <div>
                        <Label htmlFor="moneda">Moneda Origen <span className="text-red-500">*</span></Label>
                        <Controller
                            name="moneda"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Select value={field.value?.toString()} onValueChange={field.onChange}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione moneda" /></SelectTrigger>
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
                        {errors.moneda && <span className="text-red-500 text-sm">Este campo es requerido</span>}
                    </div>
                    <div>
                        <Label htmlFor="valor">Tipo de Cambio <span className="text-red-500">*</span></Label>
                        <Input id="valor" type="number" step="0.0001" {...register('valor', { required: true, min: 0 })} placeholder="0.0000" className="mt-1 font-mono" />
                        {errors.valor && <span className="text-red-500 text-sm">Ingrese un valor válido</span>}
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium mb-1">Nota:</p>
                                <p>La moneda destino es MXN por defecto. El tipo de cambio se guardará con escenario "PACTADO".</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
