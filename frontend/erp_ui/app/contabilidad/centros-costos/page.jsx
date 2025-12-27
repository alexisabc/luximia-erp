'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Loader2 } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/services/api';
import { toast } from 'sonner';

export default function CentrosCostosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // If we used standard ImportModal

    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

    useEffect(() => {
        loadData();
    }, [showInactive, search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { show_inactive: showInactive, search };
            const res = await apiClient.get('/contabilidad/centros-costos/', { params });
            setData(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando centros de costos");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (formData) => {
        try {
            if (editingItem) {
                await apiClient.put(`/contabilidad/centros-costos/${editingItem.id}/`, formData);
                toast.success("Centro actualizado correctamente");
            } else {
                await apiClient.post('/contabilidad/centros-costos/', formData);
                toast.success("Centro creado correctamente");
            }
            setIsModalOpen(false);
            setEditingItem(null);
            reset();
            loadData();
        } catch (error) {
            toast.error("Error al guardar el centro de costos");
        }
    };

    const handleDelete = async (row) => {
        if (!confirm("¿Seguro de desactivar?")) return; // Ideally use ConfirmationModal
        try {
            await apiClient.delete(`/contabilidad/centros-costos/${row.id}/`);
            toast.success("Centro desactivado");
            loadData();
        } catch (error) {
            toast.error("Error al desactivar");
        }
    };

    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setValue('codigo', item.codigo);
            setValue('nombre', item.nombre);
        } else {
            reset({ codigo: '', nombre: '' });
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Código',
            accessorKey: 'codigo',
            cell: (row) => <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{row.codigo}</span>
        },
        {
            header: 'Nombre',
            accessorKey: 'nombre',
            cell: (row) => <span className="dark:text-gray-200 font-medium">{row.nombre}</span>
        },
    ];

    // For simplicity, keeping the direct file input for now if ImportModal isn't strictly required for this specific quick refactor, 
    // but ActionButtons supports onImport. To avoid custom logic, usually we'd use ImportModal.
    // Let's use the file input via ActionButtons generic handler or keep custom if needed.
    // Ideally user wants "mismos estilos", so ActionButtons is key.

    const handleExport = async () => {
        try {
            const res = await apiClient.get('/contabilidad/centros-costos/exportar/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'centros_costos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) { toast.error("Error exportando"); }
    };

    // Custom hidden input trigger for import, executed when ActionButtons onImport is clicked
    const handleImportClick = () => {
        document.getElementById('import-file-cc').click();
    };

    const handleImportFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('archivo', file);
        try {
            await apiClient.post('/contabilidad/centros-costos/importar-excel/', formData);
            toast.success("Importación exitosa");
            loadData();
        } catch (e) {
            toast.error("Error importando");
        }
        e.target.value = '';
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <Building2 className="text-blue-600 w-8 h-8" />
                        Centros de Costos
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestiona los centros de costos para la contabilidad analítica.
                    </p>
                </div>

                {/* Hidden input for import */}
                <input type="file" id="import-file-cc" className="hidden" onChange={handleImportFileChange} accept=".xlsx,.xls" />

                <ActionButtons
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    canToggleInactive={true}
                    onCreate={() => openModal()}
                    canCreate={true}
                    onImport={handleImportClick}
                    canImport={true}
                    onExport={handleExport}
                    canExport={true}
                />
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: (row) => openModal(row),
                        onDelete: handleDelete
                    }}
                    emptyMessage="No se encontraron centros de costos."
                />
            </div>

            <ReusableModal
                title={editingItem ? "Editar Centro de Costos" : "Nuevo Centro de Costos"}
                description="Complete la información del centro de costos."
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>Código</Label>
                        <Input {...register('codigo', { required: true })} placeholder="Ej. ADM-001" className="font-mono" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input {...register('nombre', { required: true })} placeholder="Administración General" />
                    </div>
                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
