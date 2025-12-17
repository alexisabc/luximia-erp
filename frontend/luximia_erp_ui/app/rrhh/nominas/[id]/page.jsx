'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Calculator, Lock, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

import { getNominaById, calcularNomina, cerrarNomina } from '@/services/rrhh';
import { Button } from '@/components/ui/button';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import { Badge } from "@/components/ui/badge"

export default function NominaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [nomina, setNomina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculando, setCalculando] = useState(false);

    const fetchNomina = async () => {
        setLoading(true);
        try {
            const { data } = await getNominaById(params.id);
            setNomina(data);
        } catch (error) {
            toast.error("Error cargando detalle de nómina");
            router.push('/rrhh/nominas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchNomina();
    }, [params.id]);

    const handleCalcular = async () => {
        setCalculando(true);
        try {
            const { data } = await calcularNomina(params.id);
            toast.success(`Cálculo completado: ${data.procesados} recibos procesados.`);
            if (data.errores_count > 0) {
                toast.warning(`Hubo ${data.errores_count} errores. Revisa la consola.`);
                console.warn(data.errores);
            }
            fetchNomina();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Error en cálculo");
        } finally {
            setCalculando(false);
        }
    };

    const handleCerrar = async () => {
        if (!confirm("¿Cerrar nómina de forma definitiva? Ya no podrá recalcularse.")) return;
        try {
            await cerrarNomina(params.id);
            toast.success("Nómina cerrada correctamente");
            fetchNomina();
        } catch (error) {
            toast.error("Error al cerrar nómina");
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;
    if (!nomina) return null;

    const columns = [
        { header: 'Empleado', accessorKey: 'empleado_nombre', className: 'font-medium' },
        {
            header: 'Sueldo Diario',
            accessorKey: 'salario_diario',
            cell: r => `$${parseFloat(r.salario_diario).toFixed(2)}`
        },
        {
            header: 'Días Pag.',
            accessorKey: 'dias_pagados'
        },
        {
            header: 'Percepciones',
            accessorKey: 'subtotal',
            cell: r => <span className="text-gray-600 dark:text-gray-400">${parseFloat(r.subtotal).toFixed(2)}</span>
        },
        {
            header: 'Retenciones',
            accessorKey: 'impuestos_retenidos',
            cell: r => <span className="text-red-600 dark:text-red-400">-${(parseFloat(r.impuestos_retenidos) + parseFloat(r.imss_retenido)).toFixed(2)}</span>
        },
        {
            header: 'Neto a Pagar',
            accessorKey: 'neto',
            cell: r => <span className="font-bold text-emerald-700 dark:text-emerald-400">${parseFloat(r.neto).toFixed(2)}</span>
        },
    ];

    return (
        <div className="p-6 space-y-6 mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/rrhh/nominas')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{nomina.descripcion}</h1>
                            <Badge variant={nomina.estado === 'CALCULADA' ? 'default' : 'secondary'}>
                                {nomina.estado}
                            </Badge>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            Del {moment(nomina.fecha_inicio).format('DD MMM')} al {moment(nomina.fecha_fin).format('DD MMM YYYY')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {nomina.estado !== 'TIMBRADA' && (
                        <Button
                            onClick={handleCalcular}
                            disabled={calculando}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Calculator className="mr-2 h-4 w-4" />
                            {calculando ? 'Calculando...' : 'Calcular Nómina'}
                        </Button>
                    )}
                    {nomina.estado === 'CALCULADA' && (
                        <Button
                            onClick={handleCerrar}
                            variant="outline"
                            className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            Cerrar Nómina
                        </Button>
                    )}
                </div>
            </div>

            {/* Totales Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Percepciones</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${parseFloat(nomina.total_percepciones).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Deducciones (ISR+IMSS)</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">-${parseFloat(nomina.total_deducciones).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl shadow-lg text-white">
                    <p className="text-sm text-emerald-100 mb-1">Total Neto a Pagar</p>
                    <p className="text-3xl font-bold">${parseFloat(nomina.total_neto).toLocaleString()}</p>
                </div>
            </div>

            {/* Detalle Empleados */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex-grow flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recibos de Nómina ({nomina.recibos?.length || 0})</h3>
                </div>
                {/* ReusableTable for details */}
                <div className="flex-grow min-h-0">
                    <ReusableTable
                        data={nomina.recibos || []}
                        columns={columns}
                        loading={false}
                        pagination={{
                            currentPage: 1,
                            pageSize: 50,
                            totalCount: nomina.recibos?.length || 0,
                            onPageChange: () => { } // Static for now 
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
