'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import apiClient from '@/services/api';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';

export default function PolizasPage() {
    const [loading, setLoading] = useState(false);
    const [cuentas, setCuentas] = useState([]);

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            tipo: 'DIARIO',
            concepto: '',
            detalles: [
                { cuenta: '', concepto: '', debe: 0, haber: 0 },
                { cuenta: '', concepto: '', debe: 0, haber: 0 }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "detalles"
    });

    useEffect(() => {
        // Load accounts using standard apiClient
        apiClient.get('/contabilidad/cuentas-contables/')
            .then(res => setCuentas(res.data.results || res.data))
            .catch(err => {
                console.error("Error loading accounts", err);
                toast.error("Error cargando cuentas contables");
            });
    }, []);

    const detalles = watch("detalles");
    const totalDebe = detalles.reduce((sum, item) => sum + (parseFloat(item.debe) || 0), 0);
    const totalHaber = detalles.reduce((sum, item) => sum + (parseFloat(item.haber) || 0), 0);
    const isCuadrada = Math.abs(totalDebe - totalHaber) < 0.01;

    const onSubmit = async (data) => {
        if (!isCuadrada) {
            toast.error('La póliza no está cuadrada.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/contabilidad/polizas/', {
                ...data,
                total_debe: totalDebe,
                total_haber: totalHaber,
                cuadrada: true,
            });
            toast.success('Póliza guardada correctamente');
            // Suggestion: Redirect or reset form. For now, simple success.
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Error al guardar la póliza');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Nueva Póliza Contable</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Encabezado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha</label>
                                <Input type="date" {...register('fecha', { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo de Póliza</label>
                                <Controller
                                    control={control}
                                    name="tipo"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DIARIO">Diario</SelectItem>
                                                <SelectItem value="INGRESO">Ingreso</SelectItem>
                                                <SelectItem value="EGRESO">Egreso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Concepto General</label>
                                <Input {...register('concepto', { required: true })} placeholder="Descripción de la operación" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Movimientos</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ cuenta: '', debe: 0, haber: 0 })} className="gap-2">
                            <Plus size={16} /> Agregar Fila
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableRow>
                                        <TableHead className="w-[300px]">Cuenta</TableHead>
                                        <TableHead className="min-w-[200px]">Concepto (Opcional)</TableHead>
                                        <TableHead className="w-[150px] text-right">Debe</TableHead>
                                        <TableHead className="w-[150px] text-right">Haber</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Controller
                                                    control={control}
                                                    name={`detalles.${index}.cuenta`}
                                                    rules={{ required: true }}
                                                    render={({ field: selectField }) => (
                                                        <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Seleccionar..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {cuentas.map(c => (
                                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                                        {c.codigo} - {c.nombre}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input {...register(`detalles.${index}.concepto`)} placeholder="Concepto partida" />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="text-right font-mono"
                                                    {...register(`detalles.${index}.debe`)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="text-right font-mono"
                                                    {...register(`detalles.${index}.haber`)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totales */}
                        <div className="flex flex-col items-end mt-6 pr-4 space-y-2">
                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div className="text-right text-gray-500">Total Debe</div>
                                <div className="text-right font-mono font-bold">${totalDebe.toFixed(2)}</div>

                                <div className="text-right text-gray-500">Total Haber</div>
                                <div className="text-right font-mono font-bold">${totalHaber.toFixed(2)}</div>
                            </div>
                            <div className={`mt-2 px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${isCuadrada ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                <span>{isCuadrada ? 'Póliza Cuadrada' : 'Diferencia:'}</span>
                                {!isCuadrada && <span>${Math.abs(totalDebe - totalHaber).toFixed(2)}</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading || !isCuadrada} className="min-w-[150px] bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Guardando..." : <><Save className="mr-2 h-4 w-4" /> Guardar Póliza</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
