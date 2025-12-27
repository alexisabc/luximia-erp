'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Badge, Card, Modal, Spin } from 'antd'; // Assuming Ant Design or similar
import { apiClient } from '@/services/api'; // Adjust path
import { toast } from 'sonner';
import { Play, FileText } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';

// Simplified for brevity, assume we have a way to list Facturas needing provision
export default function GeneradorPolizasPage() {
    const [facturas, setFacturas] = useState([]);
    const [plantillas, setPlantillas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resFacturas, resPlantillas] = await Promise.all([
                apiClient.get('/contabilidad/facturas/?state=PENDIENTE_CONTABILIZAR'), // Conceptual query
                apiClient.get('/contabilidad/plantillas-asientos/')
            ]);
            // For demo, just show all facturas
            const allFacturas = await apiClient.get('/contabilidad/facturas/');
            setFacturas(allFacturas.data);
            setPlantillas(resPlantillas.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    const generarPoliza = async (facturaId, plantillaId) => {
        if (!plantillaId) {
            toast.warning("Selecciona una plantilla");
            return;
        }
        setGenerating(true);
        try {
            await apiClient.post(`/contabilidad/facturas/${facturaId}/generar-poliza/`, {
                plantilla_id: plantillaId
            });
            toast.success("Póliza generada correctamente");
            loadData(); // Refresh
        } catch (error) {
            toast.error("Error generando póliza");
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const columns = [
        { header: 'UUID', accessorKey: 'uuid', render: (row) => <span className="font-mono text-xs dark:text-gray-300">{row.uuid?.substring(0, 8)}...</span> },
        { header: 'Fecha', accessorKey: 'fecha_emision', render: (row) => <span className="dark:text-gray-300">{row.fecha_emision?.substring(0, 10)}</span> },
        { header: 'Receptor', accessorKey: 'receptor_nombre', render: (row) => <span className="font-medium dark:text-white">{row.receptor_nombre}</span> },
        { header: 'Total', accessorKey: 'total', render: (row) => <span className="font-bold text-green-600 dark:text-green-400">${row.total}</span> },
        {
            header: 'Acción',
            render: (row) => (
                <div className="flex gap-2 justify-center">
                    <Select
                        placeholder="Generar Póliza..."
                        className="w-48"
                        onChange={(val) => generarPoliza(row.id, val)}
                        loading={generating}
                        disabled={generating}
                    >
                        {plantillas.map(p => (
                            <Select.Option key={p.id} value={p.id}>{p.nombre}</Select.Option>
                        ))}
                    </Select>
                </div>
            )
        }
    ];


    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Generador de Pólizas
                </h1>
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={facturas}
                    columns={columns}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        </div>
    );
}
