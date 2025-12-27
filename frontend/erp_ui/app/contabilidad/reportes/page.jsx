'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/services/api';
import { Download, FileText, Loader2, Search } from 'lucide-react';

export default function ReportesPage() {
    const [tipoReporte, setTipoReporte] = useState('balanza');
    const [fechaInicio, setFechaInicio] = useState(`${new Date().getFullYear()}-01-01`);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const generarReporte = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            let params = {};

            if (tipoReporte === 'balanza') {
                endpoint = '/contabilidad/reportes-financieros/balanza_comprobacion/';
                params = { start: fechaInicio, end: fechaFin };
            } else if (tipoReporte === 'resultados') {
                endpoint = '/contabilidad/reportes-financieros/estado_resultados/';
                params = { start: fechaInicio, end: fechaFin };
            } else if (tipoReporte === 'balance') {
                endpoint = '/contabilidad/reportes-financieros/balance_general/';
                params = { date: fechaFin };
            }

            const res = await apiClient.get(endpoint, { params });
            setData(res.data);
            toast.success("Reporte generado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte");
        } finally {
            setLoading(false);
        }
    };

    const descargarXML = () => {
        const anio = fechaFin.split('-')[0];
        const mes = fechaFin.split('-')[1];
        // Use apiClient base URL logic if possible, or construct absolute URL
        // Since download requires a window open, we might need the full URL.
        // But for authenticated downloads, usually we fetch blob.
        // For simplicity, assuming session cookie works or we use a blob fetch.

        const params = new URLSearchParams({ anio, mes });
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/contabilidad/reportes-financieros/download-balanza/?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Reportes Financieros
                </h1>
            </div>

            {/* Filtros */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Configuración del Reporte</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="space-y-2 w-full md:w-1/3">
                            <label className="text-sm font-medium">Tipo de Reporte</label>
                            <Select value={tipoReporte} onValueChange={setTipoReporte}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="balanza">Balanza de Comprobación</SelectItem>
                                    <SelectItem value="resultados">Estado de Resultados</SelectItem>
                                    <SelectItem value="balance">Balance General</SelectItem>
                                </SelectContent>
                            </Select>
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

                        <div className="flex-shrink-0">
                            <Button onClick={generarReporte} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                {loading ? 'Generando...' : 'Generar'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resultados */}
            {data && (
                <Card className="shadow-sm animate-in fade-in-50 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Vista Previa</CardTitle>
                        {tipoReporte === 'balanza' && (
                            <Button variant="outline" size="sm" onClick={descargarXML}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar XML SAT
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {tipoReporte === 'balanza' && (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                        <TableRow>
                                            <TableHead className="w-[100px]">Código</TableHead>
                                            <TableHead>Cuenta</TableHead>
                                            <TableHead className="text-right">Saldo Inicial</TableHead>
                                            <TableHead className="text-right">Debe</TableHead>
                                            <TableHead className="text-right">Haber</TableHead>
                                            <TableHead className="text-right bg-gray-100 dark:bg-gray-800">Saldo Final</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row) => (
                                            <TableRow key={row.codigo}>
                                                <TableCell className="font-mono text-xs">{row.codigo}</TableCell>
                                                <TableCell className="font-medium">{row.nombre}</TableCell>
                                                <TableCell className="text-right text-gray-500">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.saldo_inicial)}</TableCell>
                                                <TableCell className="text-right text-gray-500">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.debe)}</TableCell>
                                                <TableCell className="text-right text-gray-500">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.haber)}</TableCell>
                                                <TableCell className="text-right font-bold bg-gray-50 dark:bg-gray-800/50">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.saldo_final)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {tipoReporte === 'resultados' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-green-50 rounded-xl border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                                        <div className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Total Ingresos</div>
                                        <div className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.resumen.total_ingresos)}</div>
                                    </div>
                                    <div className="p-6 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                                        <div className="text-sm font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Total Gastos</div>
                                        <div className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.resumen.total_gastos)}</div>
                                    </div>
                                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Utilidad Neta</div>
                                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.resumen.utilidad_neta)}</div>
                                    </div>
                                </div>

                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                            <TableRow>
                                                <TableHead>Concepto</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow><TableCell colSpan={2} className="bg-gray-50/50 font-bold text-gray-500 uppercase text-xs tracking-wider px-4 py-2">Ingresos</TableCell></TableRow>
                                            {data.ingresos.map(c => (
                                                <TableRow key={c.codigo}>
                                                    <TableCell className="pl-8">{c.nombre}</TableCell>
                                                    <TableCell className="text-right font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c.saldo)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow><TableCell colSpan={2} className="bg-gray-50/50 font-bold text-gray-500 uppercase text-xs tracking-wider px-4 py-2">Gastos</TableCell></TableRow>
                                            {data.gastos.map(c => (
                                                <TableRow key={c.codigo}>
                                                    <TableCell className="pl-8">{c.nombre}</TableCell>
                                                    <TableCell className="text-right font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c.saldo)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {tipoReporte === 'balance' && (
                            <div className="text-center p-10 text-gray-500">
                                {/* Placeholder for Balance General visualization */}
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Visualización de Balance General pendiente de implementación detallada.</p>
                                <p className="text-xs">Los datos crudos están disponibles en la respuesta del servidor.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
