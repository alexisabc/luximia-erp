'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { FileText, Download, Info, AlertTriangle } from 'lucide-react';

export default function DIOTPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [downloading, setDownloading] = useState(false);

    const downloadDIOT = async () => {
        if (!startDate || !endDate) {
            toast.warning("Selecciona un rango de fechas completo.");
            return;
        }

        setDownloading(true);
        try {
            const response = await apiClient.get('/contabilidad/facturas/download-diot/', {
                params: { start_date: startDate, end_date: endDate },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'DIOT.txt');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("DIOT descargada correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar la DIOT.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Declaración Informativa (DIOT)
                </h1>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Generar Reporte TXT</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-sm text-gray-500">
                            Selecciona el periodo para generar el archivo de carga batch para el SAT.
                            El sistema analizará los pagos a proveedores registrados.
                        </p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Desde</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hasta</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={downloadDIOT}
                                disabled={downloading}
                                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {downloading ? 'Generando...' : 'Descargar DIOT (.txt)'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-md">
                        <div className="flex items-start">
                            <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Información Importante</h3>
                                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                                    Este reporte se basa en el Flujo de Efectivo (Pagos). Asegúrate de que todos los pagos a proveedores estén registrados y conciliados antes de generar la declaración.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-md">
                        <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">Requisitos Previos</h3>
                                <ul className="mt-2 text-sm text-orange-700 dark:text-orange-400 list-disc list-inside space-y-1">
                                    <li>Proveedores con RFC válido.</li>
                                    <li>Tipo de Tercero (04/05/15) configurado.</li>
                                    <li>Pagos registrados en el módulo de Tesorería.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
