'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { Play, FileText, Loader2, Wand2 } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ActionButtons from '@/components/common/ActionButtons';

export default function GeneradorPolizasPage() {
    const [facturas, setFacturas] = useState([]);
    const [plantillas, setPlantillas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFactura, setSelectedFactura] = useState(null);
    const [selectedPlantilla, setSelectedPlantilla] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Carga facturas pendientes y plantillas
            const [resFacturas, resPlantillas] = await Promise.all([
                apiClient.get('/contabilidad/facturas/', { params: { estado_sat: 'VIGENTE' } }), // Ajustar filtros según necesidad
                apiClient.get('/contabilidad/plantillas-asientos/')
            ]);

            // En un caso real filtraríamos las ya contabilizadas si el backend lo permite
            setFacturas(resFacturas.data.results || resFacturas.data);
            setPlantillas(resPlantillas.data.results || resPlantillas.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando datos. Verifique que las migraciones de Base de Datos se hayan aplicado.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (factura) => {
        setSelectedFactura(factura);
        setSelectedPlantilla('');
        setIsModalOpen(true);
    };

    const handleGenerarPoliza = async () => {
        if (!selectedPlantilla) {
            toast.warning("Debes seleccionar una plantilla.");
            return;
        }

        setGenerating(true);
        try {
            await apiClient.post(`/contabilidad/facturas/${selectedFactura.id}/generar-poliza/`, {
                plantilla_id: selectedPlantilla
            });
            toast.success("Póliza generada correctamente");
            setIsModalOpen(false);
            // Opcional: Recargar datos o remover la factura de la lista si ya no es pendiente
            loadData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detalle || "Error generando póliza");
        } finally {
            setGenerating(false);
        }
    };

    const columns = [
        {
            header: 'UUID / Folio',
            accessorKey: 'uuid',
            cell: (row) => (
                <div>
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {row.serie ? `${row.serie}-` : ''}{row.folio || 'S/N'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono" title={row.uuid}>
                        {row.uuid?.substring(0, 8)}...
                    </div>
                </div>
            )
        },
        {
            header: 'Fecha',
            accessorKey: 'fecha_emision',
            cell: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(row.fecha_emision).toLocaleDateString()}</span>
        },
        {
            header: 'Receptor / Emisor',
            accessorKey: 'receptor_nombre',
            cell: (row) => (
                <div className="text-sm">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{row.receptor_nombre}</p>
                    <p className="text-xs text-gray-500">{row.receptor_rfc}</p>
                </div>
            )
        },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: (row) => <span className="font-bold text-green-600 dark:text-green-400">${parseFloat(row.total).toLocaleString()}</span>
        },
        {
            header: 'Acción',
            id: 'actions',
            cell: (row) => (
                <div className="flex justify-center">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => handleOpenModal(row)}
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generar
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <FileText className="text-blue-600 w-8 h-8" />
                        Generador de Pólizas
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Crea pólizas contables automáticamente a partir de los XMLs de facturación.
                    </p>
                </div>
                {/* Reusing ActionButtons just for consistency, even if some props are unused */}
                <ActionButtons
                    canCreate={false}
                    canImport={false}
                    canExport={false}
                // Custom buttons or just reuse the standard structure
                />
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={facturas}
                    columns={columns}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    emptyMessage="No hay facturas pendientes para procesar."
                />
            </div>

            <ReusableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Generar Póliza Contable"
                description={`Asocia una plantilla contable a la factura ${selectedFactura?.serie || ''}${selectedFactura?.folio || ''} (${selectedFactura?.uuid?.substring(0, 8)}...)`}
                footer={
                    <div className="flex justify-end gap-2 w-full pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGenerarPoliza} disabled={generating} className="bg-blue-600 hover:bg-blue-700">
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Generar Póliza
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>Plantilla de Asiento</Label>
                        <Select
                            value={selectedPlantilla}
                            onValueChange={setSelectedPlantilla}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una plantilla..." />
                            </SelectTrigger>
                            <SelectContent>
                                {plantillas.length === 0 ? (
                                    <div className="p-2 text-sm text-gray-500 text-center">No hay plantillas disponibles</div>
                                ) : (
                                    plantillas.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Define cómo se distribuirán los cargos y abonos (Provisión, Pago, etc.)
                        </p>
                    </div>
                </div>
            </ReusableModal>
        </div>
    );
}
