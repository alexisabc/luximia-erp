'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createNomina } from '@/services/rrhh';
import { Button } from '@/components/ui/button'; // Standard button
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CrearNominaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            tipo: 'ORDINARIA',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
            fecha_pago: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0]
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                razon_social: 1,
                estado: 'BORRADOR'
            };

            await createNomina(payload);
            toast.success("Nómina creada exitosamente");
            router.push('/rrhh/nominas');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Error al crear nómina");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva Nómina</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div className="grid gap-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Input
                            id="descripcion"
                            placeholder="Ej. Nómina Quincenal 1 Enero 2025"
                            {...register('descripcion', { required: 'La descripción es obligatoria' })}
                        />
                        {errors.descripcion && <span className="text-red-500 text-sm">{errors.descripcion.message}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label>Tipo de Nómina</Label>
                            <select
                                {...register('tipo')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="ORDINARIA">Ordinaria</option>
                                <option value="EXTRAORDINARIA">Extraordinaria</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                            <Input
                                id="fecha_inicio"
                                type="date"
                                {...register('fecha_inicio', { required: true })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fecha_fin">Fecha Fin</Label>
                            <Input
                                id="fecha_fin"
                                type="date"
                                {...register('fecha_fin', { required: true })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                            <Input
                                id="fecha_pago"
                                type="date"
                                {...register('fecha_pago', { required: true })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={loading ? "animate-pulse" : ""}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {loading ? "Guardando..." : "Crear Nómina"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
