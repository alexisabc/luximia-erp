'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, Loader2, TrendingUp, AlertCircle, Target } from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import apiClient from '@/services/api';

export default function CentrosCostosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [search, setSearch] = useState('');

    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

    const stats = [
        { label: 'Total Centros', value: data.length || 0, icon: Building2, gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700' },
        { label: 'Activos', value: data.filter(c => c.activo !== false).length || 0, icon: TrendingUp, gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700' },
        { label: 'Inactivos', value: data.filter(c => c.activo === false).length || 0, icon: AlertCircle, gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700' },
        { label: 'Departamentos', value: data.length || 0, icon: Target, gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700' }
    ];

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

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await apiClient.delete(`/contabilidad/centros-costos/${itemToDelete.id}/`);
            toast.success("Centro desactivado");
            loadData();
        } catch (error) {
            toast.error("Error al desactivar");
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
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
            header: 'Centro de Costos',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.nombre}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{row.codigo}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.activo !== false ? 'success' : 'secondary'}>
                    {row.activo !== false ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">Centros de Costos</h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Gestión de centros de costos contables</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={true}
                        onCreate={() => openModal()}
                        canCreate={true}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <ReusableTable
                        data={data}
                        columns={columns}
                        loading={loading}
                        onSearch={setSearch}
                        actions={{
                            onEdit: openModal,
                            onDelete: (row) => { setItemToDelete(row); setIsConfirmModalOpen(true); }
                        }}
                        emptyMessage="No hay centros de costos disponibles"
                    />
                </div>
            </div>

            <ReusableModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Centro de Costos" : "Nuevo Centro de Costos"} size="md">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
                        <Input id="codigo" {...register('codigo', { required: true })} placeholder="Ej: CC-001" className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                        <Input id="nombre" {...register('nombre', { required: true })} placeholder="Nombre del centro de costos" className="mt-1" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar')}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            <ReusableModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Desactivar Centro de Costos" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas desactivar el centro <span className="font-semibold">{itemToDelete?.nombre}</span>?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">El centro ya no aparecerá en las listas principales.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
                    </div>
                </div>
            </ReusableModal>
        </div>
    );
}
