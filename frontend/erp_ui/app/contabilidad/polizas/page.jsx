'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Adjust imports based on actual component structure
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import axios from 'axios';

// IMPORTANT: This component assumes components/ui exist. 
// If Select/Table are not standard shadcn/ui, I might need to adjust.
// Based on file list, they exist.

export default function PolizasPage() {
    const [loading, setLoading] = useState(false);
    const [cuentas, setCuentas] = useState([]);

    // Form setup
    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            tipo: 'DIARIO',
            concepto: '',
            detalles: [
                { cuenta: '', concepto: '', debe: 0, haber: 0, referencia: '' },
                { cuenta: '', concepto: '', debe: 0, haber: 0, referencia: '' }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "detalles"
    });

    // Fetch Accounts for dropdown
    useEffect(() => {
        axios.get('/api/contabilidad/cuentas-contables/')
            .then(res => setCuentas(res.data.results || res.data))
            .catch(err => console.error("Error loading accounts", err));
    }, []);

    // Totals Calculation
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
            await axios.post('/api/contabilidad/polizas/', {
                ...data,
                total_debe: totalDebe,
                total_haber: totalHaber,
                cuadrada: true,
                numero: 1 // Backend should handle auto-increment, but providing dummy if needed
            });
            toast.success('Póliza guardada correctamente');
            // Reset form or redirect
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar la póliza');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Nueva Póliza Contable</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos Generales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha</label>
                            <Input type="date" {...register('fecha', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...register('tipo')}
                            >
                                <option value="DIARIO">Diario</option>
                                <option value="INGRESO">Ingreso</option>
                                <option value="EGRESO">Egreso</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Concepto General</label>
                            <Input {...register('concepto', { required: true })} placeholder="Descripción de la operación" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Detalles / Movimientos</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => append({ cuenta: '', debe: 0, haber: 0 })}>
                        + Agregar Fila
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Cuenta</TableHead>
                                <TableHead>Concepto (Opcional)</TableHead>
                                <TableHead className="w-[15%] text-right">Debe</TableHead>
                                <TableHead className="w-[15%] text-right">Haber</TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            {...register(`detalles.${index}.cuenta`, { required: true })}
                                        >
                                            <option value="">Seleccione Cuenta...</option>
                                            {cuentas.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.codigo} - {c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <Input {...register(`detalles.${index}.concepto`)} placeholder="Concepto partida" />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="text-right"
                                            {...register(`detalles.${index}.debe`)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="text-right"
                                            {...register(`detalles.${index}.haber`)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500">
                                            X
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Footer Totals */}
                    <div className="flex justify-end mt-4 space-x-8 text-lg font-semibold">
                        <div className={totalDebe !== totalHaber ? "text-red-500" : "text-green-600"}>
                            Total Debe: ${totalDebe.toFixed(2)}
                        </div>
                        <div className={totalDebe !== totalHaber ? "text-red-500" : "text-green-600"}>
                            Total Haber: ${totalHaber.toFixed(2)}
                        </div>
                    </div>
                    {!isCuadrada && (
                        <div className="text-right text-red-500 text-sm mt-1">Diferencia: ${(totalDebe - totalHaber).toFixed(2)}</div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSubmit(onSubmit)} disabled={loading || !isCuadrada} className="w-full md:w-auto">
                    {loading ? "Guardando..." : "Guardar Póliza"}
                </Button>
            </div>
        </div>
    );
}
