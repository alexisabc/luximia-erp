'use client';

import React, { useState } from 'react';
import apiClient from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Calculator, Download, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import ActionButtons from '@/components/common/ActionButtons';

export default function PTUPage() {
    const [anio, setAnio] = useState(new Date().getFullYear() - 1);
    const [monto, setMonto] = useState('');
    const [proyecto, setProyecto] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    const calcular = async () => {
        if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
            toast.error("Por favor ingresa un monto válido a repartir.");
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.post('/rrhh/ptu/calcular-proyecto/', {
                anio,
                monto
            });
            const resultados = res.data;
            setProyecto(resultados);

            // Calculate simple stats
            const totalRepartido = resultados.reduce((acc, curr) => acc + curr.total_ptu, 0);
            const empleadosBeneficiados = resultados.length;
            const promedio = empleadosBeneficiados > 0 ? totalRepartido / empleadosBeneficiados : 0;

            setStats({
                total: totalRepartido,
                empleados: empleadosBeneficiados,
                promedio
            });

            toast.success("Cálculo de PTU generado exitosamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al calcular el PTU. Verifique que existan registros de nómina para el año seleccionado.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        toast.info("Descarga de PDF/Excel iniciada...");
        // Implementar endpoint real de descarga si existe, ej:
        // apiClient.post('/rrhh/ptu/exportar/', { proyecto }, { responseType: 'blob' })...
    };

    return (
        <div className="p-8 space-y-8 min-h-screen bg-gray-50/50 dark:bg-gray-900/10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <Calculator className="w-8 h-8 text-blue-600" />
                        Reparto de Utilidades (PTU)
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Cálculo y proyección del reparto conforme a la LFT.
                    </p>
                </div>
                <div className="flex gap-3">
                    <ActionButtons
                        canCreate={false}
                        canImport={false}
                        canExport={proyecto.length > 0}
                        onExport={handleExport}
                    />
                </div>
            </div>

            {/* Config & Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Card */}
                <Card className="lg:col-span-1 shadow-md border-0 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <RefreshCw className="w-5 h-5 text-indigo-500" />
                            Parámetros del Ejercicio
                        </CardTitle>
                        <CardDescription>Introduce los datos fiscales para el cálculo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Año del Ejercicio</label>
                            <Input
                                type="number"
                                value={anio}
                                onChange={(e) => setAnio(e.target.value)}
                                className="font-mono text-lg bg-gray-50 dark:bg-gray-900 border-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Monto a Repartir (10%)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type="number"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-9 font-mono text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 text-green-700 dark:text-green-400 font-bold"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={calcular}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all"
                        >
                            {loading ? 'Calculando...' : 'Calcular Proyecto'}
                        </Button>
                    </CardContent>
                </Card>

                {/* KPI Cards (Only visible if calculated) */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-sm text-gray-500">Total Calculado</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats ? stats.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '$0.00'}
                            </span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-sm text-gray-500">Empleados Beneficiados</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats ? stats.empleados : '0'}
                            </span>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-sm text-gray-500">Promedio por Empleado</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats ? stats.promedio.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '$0.00'}
                            </span>
                        </CardContent>
                    </Card>

                    {/* Placeholder for future charts or distribution info */}
                    {!proyecto.length && (
                        <div className="hidden lg:flex col-span-3 h-full items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-gray-400">
                            Ingresa los parámetros para ver la proyección.
                        </div>
                    )}
                </div>
            </div>

            {/* Results Table */}
            {proyecto.length > 0 && (
                <Card className="shadow-lg border-0 overflow-hidden dark:bg-gray-800">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                        <CardTitle>Desglose por Empleado</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-700 dark:text-gray-300">Empleado</TableHead>
                                    <TableHead className="text-right font-semibold">Días Trabajados</TableHead>
                                    <TableHead className="text-right font-semibold">Salario Anual Base</TableHead>
                                    <TableHead className="text-right text-blue-600 font-semibold" title="50% Días">PTU (Días)</TableHead>
                                    <TableHead className="text-right text-purple-600 font-semibold" title="50% Salario">PTU (Salarios)</TableHead>
                                    <TableHead className="text-right font-extrabold text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10">Total a Pagar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proyecto.map((item, idx) => (
                                    <TableRow key={item.empleado_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                                        <TableCell className="font-medium">{item.nombre}</TableCell>
                                        <TableCell className="text-right font-mono text-gray-600">{item.dias_trabajados.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-gray-600">${item.salario_anual_base.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-blue-600/80">${item.ptu_por_dias.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono text-purple-600/80">${item.ptu_por_salarios.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-green-700 dark:text-green-400 bg-green-50/30 dark:bg-green-900/10 border-l border-green-100 dark:border-green-900/30">
                                            ${item.total_ptu.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    );
}
