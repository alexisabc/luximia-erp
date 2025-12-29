'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { FileCode, ShieldCheck, Loader2 } from 'lucide-react';

export default function ContabilidadElectronicaPage() {
    const [monthStr, setMonthStr] = useState(''); // Format: YYYY-MM
    const [loading, setLoading] = useState({});

    const downloadXML = async (type) => {
        if (!monthStr) {
            toast.warning("Selecciona mes y año.");
            return;
        }

        const [anio, mes] = monthStr.split('-');

        setLoading(prev => ({ ...prev, [type]: true }));
        try {
            const endpoint = type === 'CATALOGO'
                ? '/contabilidad/facturas/download-catalogo/'
                : '/contabilidad/facturas/download-balanza/';

            const response = await apiClient.get(endpoint, {
                params: { anio, mes },
                responseType: 'blob'
            });

            const filename = type === 'CATALOGO' ? 'Catalogo.xml' : 'Balanza.xml';
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Archivo descargado.");
        } catch (error) {
            console.error(error);
            toast.error("Error descargando XML.");
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Contabilidad Electrónica (SAT)
                </h1>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>1. Catálogo de Cuentas</CardTitle>
                        <CardDescription>
                            Se envía por única vez o cada vez que se modifique el catálogo a nivel mayor o subcuenta de primer nivel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Periodo</label>
                            <Input
                                type="month"
                                value={monthStr}
                                onChange={(e) => setMonthStr(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => downloadXML('CATALOGO')}
                            disabled={loading['CATALOGO']}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading['CATALOGO'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCode className="mr-2 h-4 w-4" />}
                            Descargar Catálogo (XML)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>2. Balanza de Comprobación</CardTitle>
                        <CardDescription>
                            Se envía mensualmente. Debe coincidir con los saldos de tus pólizas registradas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Periodo</label>
                            <Input
                                type="month"
                                value={monthStr}
                                onChange={(e) => setMonthStr(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => downloadXML('BALANZA')}
                            disabled={loading['BALANZA']}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {loading['BALANZA'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCode className="mr-2 h-4 w-4" />}
                            Descargar Balanza (XML)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
