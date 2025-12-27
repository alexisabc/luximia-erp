'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';
import { Download } from 'lucide-react';

export default function ReportesPage() {
    const [tipoReporte, setTipoReporte] = useState('balanza');
    const [fechaInicio, setFechaInicio] = useState(new Date().getFullYear() + '-01-01');
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const generarReporte = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            let params = {};

            if (tipoReporte === 'balanza') {
                endpoint = '/api/contabilidad/reportes-financieros/balanza_comprobacion/';
                params = { start: fechaInicio, end: fechaFin };
            } else if (tipoReporte === 'resultados') {
                endpoint = '/api/contabilidad/reportes-financieros/estado_resultados/';
                params = { start: fechaInicio, end: fechaFin };
            } else if (tipoReporte === 'balance') {
                endpoint = '/api/contabilidad/reportes-financieros/balance_general/';
                params = { date: fechaFin };
            }

            const res = await axios.get(endpoint, { params });
            setData(res.data);
            toast.success("Reporte generado");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar reporte");
        } finally {
            setLoading(false);
        }
    };

    const descargarXML = (tipo) => {
        // Lógica para descargar XML del SAT si aplica
        const anio = fechaFin.split('-')[0];
        const mes = fechaFin.split('-')[1];
        const url = `/api/contabilidad/reportes-financieros/download-balanza/?anio=${anio}&mes=${mes}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Reportes Financieros</h1>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full md:w-1/4">
                            <label className="text-sm font-medium">Tipo de Reporte</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={tipoReporte}
                                onChange={(e) => setTipoReporte(e.target.value)}
                            >
                                <option value="balanza">Balanza de Comprobación</option>
                                <option value="resultados">Estado de Resultados</option>
                                <option value="balance">Balance General</option>
                            </select>
                        </div>

                        {tipoReporte !== 'balance' && (
                            <div className="space-y-2 w-full md:w-1/4">
                                <label className="text-sm font-medium">Fecha Inicio</label>
                                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                            </div>
                        )}

                        <div className="space-y-2 w-full md:w-1/4">
                            <label className="text-sm font-medium">{tipoReporte === 'balance' ? 'Fecha de Corte' : 'Fecha Fin'}</label>
                            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                        </div>

                        <Button onClick={generarReporte} disabled={loading}>
                            {loading ? 'Generando...' : 'Generar Reporte'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Resultados */}
            {data && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Resultados</CardTitle>
                        {tipoReporte === 'balanza' && (
                            <Button variant="outline" size="sm" onClick={() => descargarXML('balanza')}>
                                <Download className="mr-2 h-4 w-4" />
                                XML SAT
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {tipoReporte === 'balanza' && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Cuenta</TableHead>
                                        <TableHead className="text-right">Saldo Inicial</TableHead>
                                        <TableHead className="text-right">Debe</TableHead>
                                        <TableHead className="text-right">Haber</TableHead>
                                        <TableHead className="text-right">Saldo Final</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row) => (
                                        <TableRow key={row.codigo}>
                                            <TableCell>{row.codigo}</TableCell>
                                            <TableCell>{row.nombre}</TableCell>
                                            <TableCell className="text-right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.saldo_inicial)}</TableCell>
                                            <TableCell className="text-right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.debe)}</TableCell>
                                            <TableCell className="text-right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.haber)}</TableCell>
                                            <TableCell className="text-right font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.saldo_final)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {tipoReporte === 'resultados' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600">Total Ingresos</div>
                                        <div className="text-2xl font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.resumen.total_ingresos)}</div>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                        <div className="text-sm text-red-600">Total Gastos</div>
                                        <div className="text-2xl font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.resumen.total_gastos)}</div>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-600">Utilidad Neta</div>
                                        <div className="text-2xl font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.resumen.utilidad_neta)}</div>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-lg">Desglose</h3>
                                <Table>
                                    <TableHead><TableRow><TableCell className="font-bold">Cuenta</TableCell><TableCell className="text-right font-bold">Monto</TableCell></TableRow></TableHead>
                                    <TableBody>
                                        <TableRow><TableCell colSpan={2} className="bg-muted font-bold">Ingresos</TableCell></TableRow>
                                        {data.ingresos.map(c => (
                                            <TableRow key={c.codigo}><TableCell>{c.nombre}</TableCell><TableCell className="text-right">{c.saldo}</TableCell></TableRow>
                                        ))}
                                        <TableRow><TableCell colSpan={2} className="bg-muted font-bold">Gastos</TableCell></TableRow>
                                        {data.gastos.map(c => (
                                            <TableRow key={c.codigo}><TableCell>{c.nombre}</TableCell><TableCell className="text-right">{c.saldo}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
