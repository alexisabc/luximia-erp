'use client';

import React, { useState } from 'react';
import { DatePicker, Button, Card, Alert } from 'antd';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

import moment from 'moment';

export default function DIOTPage() {
    const [dates, setDates] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const downloadDIOT = async () => {
        if (!dates || dates.length !== 2) {
            toast.warning("Selecciona un rango de fechas.");
            return;
        }

        const start = dates[0].format('YYYY-MM-DD');
        const end = dates[1].format('YYYY-MM-DD');

        setDownloading(true);
        try {
            // We use fetch directly to handle blob/file download better than axios wrapper sometimes
            // But if apiClient handles it, great. Let's assume axios.
            const response = await apiClient.get('/contabilidad/facturas/download-diot/', {
                params: { start_date: start, end_date: end },
                responseType: 'blob'
            });

            // Trigger browser download
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
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                Declaración Informativa (DIOT)
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Generar Reporte TXT</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Selecciona el periodo para generar el archivo de carga batch para el SAT.
                        El sistema analizará los pagos a proveedores registrados.
                    </p>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Periodo</label>
                            <RangePicker
                                onChange={(val) => setDates(val)}
                                className="w-full"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            icon={<Download size={16} />}
                            onClick={downloadDIOT}
                            loading={downloading}
                            block
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Descargar DIOT (.txt)
                        </Button>
                    </div>
                </Card>

                <div className="space-y-4">
                    <Alert
                        message="Información Importante"
                        description="Este reporte se basa en el Flujo de Efectivo (Pagos). Asegúrate de que todos los pagos a proveedores estén registrados y conciliados antes de generar la declaración."
                        type="info"
                        showIcon
                    />
                    <Alert
                        message="Requisitos Previos"
                        description={
                            <ul className="list-disc pl-4 mt-2 text-xs">
                                <li>Proveedores con RFC válido.</li>
                                <li>Tipo de Tercero (04/05/15) configurado.</li>
                                <li>Pagos registrados en el módulo de Tesorería.</li>
                            </ul>
                        }
                        type="warning"
                        showIcon
                    />
                </div>
            </div>
        </div>
    );
}
