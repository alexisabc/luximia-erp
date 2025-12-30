'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Layers, Loader2, AlertCircle, TrendingUp,
    DollarSign, Building
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import apiClient from '@/services/api';
import ImportModal from '@/components/modals/Import';

export default function CuentasContablesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stats = [
        {
            label: 'Total Cuentas',
            value: data.length || 0,
            icon: Layers,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Activas',
            value: data.filter(c => c.activo !== false).length || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Por Tipo',
            value: new Set(data.map(c => c.tipo)).size || 0,
            icon: Building,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Niveles',
            value: Math.max(...data.map(c => c.nivel || 0), 0),
            icon: DollarSign,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    useEffect(() => {
        loadData();
    }, [showInactive, search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { show_inactive: showInactive, search };
            const res = await apiClient.get('/contabilidad/cuentas-contables/', { params });
            setData(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando cuentas contables");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/contabilidad/cuentas-contables/${editingItem.id}/`, formData);
                toast.success("Cuenta actualizada correctamente");
            } else {
                await apiClient.post('/contabilidad/cuentas-contables/', formData);
                toast.success("Cuenta creada correctamente");
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({});
            loadData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detalle || "Error al guardar la cuenta");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (row) => {
        setItemToDelete(row);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await apiClient.delete(`/contabilidad/cuentas-contables/${itemToDelete.id}/`);
            toast.success("Cuenta desactivada correctamente");
            loadData();
        } catch (error) {
            toast.error("Error al desactivar la cuenta");
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleExport = async () => {
        try {
            const res = await apiClient.get('/contabilidad/cuentas-contables/exportar/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'cuentas_contables.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Catálogo exportado exitosamente");
        } catch (e) {
            console.error(e);
            toast.error("Error al exportar el catálogo");
        }
    };

    const handleImportar = async (formData) => {
        return await apiClient.post('/contabilidad/cuentas-contables/importar-excel/', formData);
    };

    const openNewModal = () => {
        setEditingItem(null);
        setFormData({});
        setIsModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingItem(row);
        setFormData(row);
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Cuenta',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-mono font-bold text-gray-800 dark:text-gray-200">{row.codigo}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{row.nombre}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Tipo',
            render: (row) => {
                const colors = {
                    ACTIVO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    PASIVO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    CAPITAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                    INGRESOS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    EGRESOS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                    COSTOS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                    ORDEN: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                };
                return (
                    <Badge className={colors[row.tipo] || 'bg-gray-100 text-gray-800'}>
                        {row.tipo}
                    </Badge>
                );
            }
        },
        {
            header: 'Nivel',
            render: (row) => (
                <span className="text-gray-500 dark:text-gray-400 text-center block">{row.nivel}</span>
            )
        },
        {
            header: 'SAT',
            render: (row) => (
                <span className="text-xs font-mono text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                    {row.codigo_agrupador || '-'}
                </span>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Layers className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                            Catálogo de Cuentas
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Gestiona la estructura contable de la organización
                        </p>
                    </div>
                    <ActionButtonGroup
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={true}
                        onCreate={openNewModal}
                        canCreate={true}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={true}
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
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
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
                        actions={{ onEdit: openEditModal, onDelete: confirmDelete }}
                        emptyMessage="No se encontraron cuentas contables"
                        pagination={{ pageSize: 50 }}
                    />
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Cuenta" : "Nueva Cuenta"} size="lg">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
                            <Input id="codigo" value={formData.codigo || ''} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ej: 1.1.01" required className="mt-1 font-mono" />
                        </div>
                        <div>
                            <Label htmlFor="nivel">Nivel <span className="text-red-500">*</span></Label>
                            <Input id="nivel" type="number" value={formData.nivel || ''} onChange={(e) => setFormData({ ...formData, nivel: e.target.value })} required className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                            <Input id="nombre" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre de la cuenta" required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
                            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="PASIVO">Pasivo</SelectItem>
                                    <SelectItem value="CAPITAL">Capital</SelectItem>
                                    <SelectItem value="INGRESOS">Ingresos</SelectItem>
                                    <SelectItem value="EGRESOS">Egresos</SelectItem>
                                    <SelectItem value="COSTOS">Costos</SelectItem>
                                    <SelectItem value="ORDEN">Orden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="codigo_agrupador">Código Agrupador SAT</Label>
                            <Input id="codigo_agrupador" value={formData.codigo_agrupador || ''} onChange={(e) => setFormData({ ...formData, codigo_agrupador: e.target.value })} placeholder="Opcional" className="mt-1 font-mono" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Desactivar Cuenta" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas desactivar la cuenta <span className="font-semibold">{itemToDelete?.codigo}</span>?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">La cuenta ya no aparecerá en las listas principales.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
                    </div>
                </div>
            </Modal>

            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportar} onSuccess={() => { loadData(); toast.success('Cuentas importadas exitosamente'); }} templateUrl="/contabilidad/cuentas-contables/exportar-plantilla/" />
        </div>
    );
}
