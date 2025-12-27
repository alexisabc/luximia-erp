'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';
import { Calculator, Download } from 'lucide-react';

export default function PTUPage() {
    const [anio, setAnio] = useState(new Date().getFullYear() - 1);
    const [monto, setMonto] = useState('');
    const [proyecto, setProyecto] = useState([]);
    const [loading, setLoading] = useState(false);

    const calcular = async () => {
        if (!monto || isNaN(monto)) {
            toast.error("Ingresa un monto válido");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('/api/rrhh/ptu/calcular-proyecto/', {
                anio,
                monto
            });
            setProyecto(res.data);
            toast.success("Proyecto calculado");
        } catch (error) {
            console.error(error);
            toast.error("Error al calcular");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Reparto de Utilidades (PTU)</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración del Proyecto</CardTitle>
                    <CardDescription>Simulación de reparto conforme a la Ley Federal del Trabajo</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Año del Ejercicio</label>
                        <Input
                            type="number"
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                            className="w-32"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Monto a Repartir</label>
                        <Input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="Ej. 500000"
                            className="w-48"
                        />
                    </div>
                    <Button onClick={calcular} disabled={loading}>
                        <Calculator className="mr-2 h-4 w-4" />
                        {loading ? 'Calculando...' : 'Generar Proyecto'}
                    </Button>
                </CardContent>
            </Card>

            {proyecto.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle del Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead className="text-right">Días Trabajados</TableHead>
                                    <TableHead className="text-right">Salario Anual</TableHead>
                                    <TableHead className="text-right">Parte Días (50%)</TableHead>
                                    <TableHead className="text-right">Parte Salarios (50%)</TableHead>
                                    <TableHead className="text-right font-bold">Total PTU</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proyecto.map((item) => (
                                    <TableRow key={item.empleado_id}>
                                        <TableCell>{item.nombre}</TableCell>
                                        <TableCell className="text-right">{item.dias_trabajados.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">${item.salario_anual_base.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">${item.ptu_por_dias.toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">${item.ptu_por_salarios.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold">${item.total_ptu.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
