'use client';

import React, { useState } from 'react';
import { DatePicker, Button, Card, Tabs, Select } from 'antd';
import { FileCode, ShieldCheck } from 'lucide-react';
import apiClient from '@/services/api';
import { toast } from 'sonner';

export default function ContabilidadElectronicaPage() {
    const [month, setMonth] = useState(null);
    const [loading, setLoading] = useState({});

    const downloadXML = async (type) => {
        if (!month) {
            toast.warning("Selecciona mes y año.");
            return;
        }

        const anio = month.year();
        const mes = month.month() + 1; // 0-indexed

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
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
                Contabilidad Electrónica (SAT)
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
                <Card title="1. Catálogo de Cuentas" className="shadow-sm">
                    <p className="text-sm text-gray-500 mb-4">
                        Se envía por única vez o cada vez que se modifique el catálogo a nivel mayor o subcuenta de primer nivel.
                    </p>
                    <div className="flex flex-col gap-4">
                        <DatePicker.MonthPicker
                            onChange={val => setMonth(val)}
                            placeholder="Mes de envío"
                            className="w-full"
                        />
                        <Button
                            icon={<FileCode size={16} />}
                            onClick={() => downloadXML('CATALOGO')}
                            loading={loading['CATALOGO']}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Descargar Catálogo (XML)
                        </Button>
                    </div>
                </Card>

                <Card title="2. Balanza de Comprobación" className="shadow-sm">
                    <p className="text-sm text-gray-500 mb-4">
                        Se envía mensualmente. Debe coincidir con los saldos de tus pólizas registradas.
                    </p>
                    <div className="flex flex-col gap-4">
                        <DatePicker.MonthPicker
                            onChange={val => setMonth(val)}
                            placeholder="Periodo"
                            value={month}
                            className="w-full"
                        />
                        <Button
                            icon={<FileCode size={16} />}
                            onClick={() => downloadXML('BALANZA')}
                            loading={loading['BALANZA']}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Descargar Balanza (XML)
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
