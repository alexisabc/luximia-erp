'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Package, Plus, Loader2, DollarSign, TrendingUp, AlertCircle, Layers } from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import apiClient from '@/services/api';

export default function InsumosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [monedas, setMonedas] = useState([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({ codigo: '', nombre: '', unidad_medida: '', costo_unitario: '', moneda: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stats = [
        { label: 'Total Insumos', value: data.length || 0, icon: Package, gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700' },
        { label: 'Activos', value: data.filter(i => i.activo !== false).length || 0, icon: TrendingUp, gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700' },
        { label: 'Unidades', value: new Set(data.map(i => i.unidad_medida)).size || 0, icon: Layers, gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700' },
        { label: 'Costo Promedio', value: data.length > 0 ? `$${(data.reduce((sum, i) => sum + parseFloat(i.costo_unitario || 0), 0) / data.length).toFixed(2)}` : '$0.00', icon: DollarSign, gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700', isAmount: true }
    ];

    useEffect(() => {
        loadData();
        loadMonedas();
    }, [showInactive, search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { show_inactive: showInactive, search };
            const res = await apiClient.get('/compras/insumos/', { params });
            setData(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando insumos");
        } finally {
            setLoading(false);
        }
    };

    const loadMonedas = async () => {
        try {
            const res = await apiClient.get('/contabilidad/monedas/');
            setMonedas(res.data.results || res.data);
        } catch (e) { }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/compras/insumos/${editingItem.id}/`, formData);
                toast.success("Insumo actualizado");
            } else {
                await apiClient.post('/compras/insumos/', formData);
                toast.success("Insumo creado");
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({ codigo: '', nombre: '', unidad_medida: '', costo_unitario: '', moneda: '' });
            loadData();
        } catch (error) {
            toast.error("Error guardando");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (row) => {
        try {
            await apiClient.delete(`/compras/insumos/${row.id}/`);
            toast.success("Desactivado");
            loadData();
        } catch (error) {
            toast.error("Error desactivando");
        }
    };

    const handleExport = async () => {
        try {
            const res = await apiClient.get('/compras/insumos/exportar/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'insumos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Exportado exitosamente");
        } catch (e) {
            toast.error("Error exportando");
        }
    };

    const columns = [
        {
            header: 'Insumo',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.nombre}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{row.codigo}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Unidad',
            render: (row) => <Badge variant="outline">{row.unidad_medida}</Badge>
        },
        {
            header: 'Costo',
            render: (row) => (
                <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">${row.costo_unitario}</div>
                    <div className="text-xs text-gray-500">{row.moneda?.codigo || 'MXN'}</div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">Catálogo de Insumos</h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Gestión de materiales y recursos</p>
                    </div>
                    <ActionButtonGroup
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={true}
                        onCreate={() => { setEditingItem(null); setFormData({ codigo: '', nombre: '', unidad_medida: '', costo_unitario: '', moneda: '' }); setIsModalOpen(true); }}
                        canCreate={true}
                        onExport={handleExport}
                        canExport={true}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <DataTable
                        data={data}
                        columns={columns}
                        loading={loading}
                        onSearch={setSearch}
                        actions={{
                            onEdit: (row) => { setEditingItem(row); setFormData({ codigo: row.codigo, nombre: row.nombre, unidad_medida: row.unidad_medida, costo_unitario: row.costo_unitario, moneda: row.moneda?.id }); setIsModalOpen(true); },
                            onDelete: handleDelete
                        }}
                        emptyMessage="No hay insumos disponibles"
                    />
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Insumo" : "Nuevo Insumo"} size="lg">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
                            <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ej: INS-001" required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="unidad_medida">Unidad <span className="text-red-500">*</span></Label>
                            <Input id="unidad_medida" value={formData.unidad_medida} onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })} placeholder="PZA, KG, M3..." required className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                            <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre del insumo" required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="costo_unitario">Costo Unitario</Label>
                            <Input id="costo_unitario" type="number" step="0.01" value={formData.costo_unitario} onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })} placeholder="0.00" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="moneda">Moneda</Label>
                            <Select value={formData.moneda?.toString()} onValueChange={(value) => setFormData({ ...formData, moneda: value })}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione moneda" /></SelectTrigger>
                                <SelectContent>
                                    {monedas.map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.codigo} - {m.nombre}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar Insumo')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
