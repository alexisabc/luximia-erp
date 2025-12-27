'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Download, Upload as UploadIcon, Building2 } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Switch } from '@/components/ui/switch'; // Ensure this exists or use check
import apiClient from '@/services/api';
import { toast } from 'sonner';

export default function CentrosCostosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState('');

    const { register, handleSubmit, reset, setValue } = useForm();

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
                toast.success("Centro actualizado");
            } else {
                await apiClient.post('/contabilidad/centros-costos/', formData);
                toast.success("Centro creado");
            }
            setIsModalOpen(false);
            setEditingItem(null);
            reset();
            loadData();
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro de desactivar?")) return;
        try {
            await apiClient.delete(`/contabilidad/centros-costos/${id}/`);
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
        { header: 'Código', accessorKey: 'codigo', render: (row) => <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{row.codigo}</span> },
        { header: 'Nombre', accessorKey: 'nombre', render: (row) => <span className="dark:text-gray-200 font-medium">{row.nombre}</span> },
    ];

    const handleImport = async (e) => {
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
        e.target.value = ''; // Reset input
    };

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

    return (
        <div className="p-8 h-full flex flex-col space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="text-purple-600" />
                    Centros de Costos
                </h1>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 mr-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Ver Inactivos</span>
                        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                    </div>

                    <div className="relative">
                        <input type="file" id="import-file" className="hidden" onChange={handleImport} accept=".xlsx,.xls" />
                        <label htmlFor="import-file">
                            <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild>
                                <span><UploadIcon size={16} /> Importar</span>
                            </Button>
                        </label>
                    </div>

                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}><Download size={16} /> Exportar</Button>
                    <Button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700 gap-2"><Plus size={16} /> Nuevo</Button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ReusableTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: (row) => openModal(row),
                        onDelete: handleDelete
                    }}
                />
            </div>

            <ReusableModal
                title={editingItem ? "Editar Centro" : "Nuevo Centro"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Código</label>
                        <Input {...register('codigo', { required: true })} placeholder="Ej. ADM-001" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <Input {...register('nombre', { required: true })} placeholder="Administración General" />
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
