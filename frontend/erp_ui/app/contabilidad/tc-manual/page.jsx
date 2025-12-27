'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { Banknote, Loader2 } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function TiposCambioManualPage() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [monedas, setMonedas] = useState([]);

    // Form handling
    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm();

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
                moneda_origen_id: data.moneda,
                // moneda_destino_id: null, (implícito 'MXN' visualmente si es null)
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
            header: 'Fecha',
            accessorKey: 'fecha',
            cell: (row) => <span className="text-gray-900 dark:text-gray-100 font-medium">{row.fecha}</span>
        },
        {
            header: 'Moneda Origen',
            accessorKey: 'moneda_origen',
            cell: (row) => <span className="font-bold dark:text-white">{row.moneda_origen?.codigo || 'USD'}</span>
        },
        {
            header: 'Moneda Destino',
            accessorKey: 'moneda_destino',
            cell: (row) => <span className="text-gray-500 dark:text-gray-400">{row.moneda_destino?.codigo || 'MXN'}</span>
        },
        {
            header: 'Tipo de Cambio',
            accessorKey: 'valor',
            cell: (row) => <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">${parseFloat(row.valor).toFixed(4)}</span>
        },
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <Banknote className="text-blue-600 w-8 h-8" />
                        Tipos de Cambio Manuales
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Registra tasas de cambio para operaciones en moneda extranjera.
                    </p>
                </div>

                <ActionButtons
                    canCreate={true}
                    onCreate={() => { reset(); setIsModalOpen(true); }}
                    canImport={false}
                    canExport={false}
                />
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={rates}
                    columns={columns}
                    loading={loading}
                    actions={{
                        onDelete: (row) => toast.info("Función de borrar pendiente")
                    }}
                    emptyMessage="No hay tipos de cambio registrados."
                />
            </div>

            <ReusableModal
                title="Registrar Tipo de Cambio"
                description="Ingresa el valor de la moneda extranjera en moneda nacional."
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input type="date" {...register('fecha', { required: 'La fecha es requerida' })} />
                        {errors.fecha && <span className="text-red-500 text-xs">{errors.fecha.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Moneda Extranjera</Label>
                        <Controller
                            name="moneda"
                            control={control}
                            rules={{ required: 'Selecciona una moneda' }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monedas.map(m => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.codigo} - {m.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.moneda && <span className="text-red-500 text-xs">{errors.moneda.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Valor en MXN</Label>
                        <Input
                            type="number"
                            step="0.0001"
                            {...register('valor', { required: 'El valor es requerido', min: 0 })}
                            placeholder="Ej. 18.50"
                        />
                        {errors.valor && <span className="text-red-500 text-xs">{errors.valor.message}</span>}
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
