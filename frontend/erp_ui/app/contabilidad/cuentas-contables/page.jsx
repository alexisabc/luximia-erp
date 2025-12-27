'use client';

import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ConfirmationModal from '@/components/modals/Confirmation';
import ImportModal from '@/components/modals/Import';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import apiClient from '@/services/api';
import { toast } from 'sonner';

export default function CuentasContablesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [search, setSearch] = useState('');

    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [formData, setFormData] = useState({});

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
            header: 'Código',
            accessorKey: 'codigo',
            cell: (row) => <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{row.codigo}</span>
        },
        {
            header: 'Nombre',
            accessorKey: 'nombre',
            cell: (row) => <span className="font-medium">{row.nombre}</span>
        },
        {
            header: 'Tipo',
            accessorKey: 'tipo',
            cell: (row) => {
                const colors = {
                    ACTIVO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    PASIVO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    CAPITAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                    INGRESOS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    EGRESOS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                    COSTOS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                    ORDEN: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                };
                return (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${colors[row.tipo] || 'bg-gray-100 text-gray-800'}`}>
                        {row.tipo}
                    </span>
                );
            }
        },
        {
            header: 'Nivel',
            accessorKey: 'nivel',
            cell: (row) => <span className="text-gray-500 text-center block">{row.nivel}</span>
        },
        {
            header: 'Agrupador SAT',
            accessorKey: 'codigo_agrupador',
            cell: (row) => <span className="text-xs font-mono text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{row.codigo_agrupador || '-'}</span>
        },
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <Layers className="text-blue-600 w-8 h-8" />
                        Catálogo de Cuentas
                    </h1>
                    <p className="text-gray-500 mt-1">Gestiona la estructura contable de la organización.</p>
                </div>

                <ActionButtons
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

            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: openEditModal,
                        onDelete: confirmDelete
                    }}
                    emptyMessage="No se encontraron cuentas contables."
                    pagination={{ pageSize: 50 }} // Increased page size for chart of accounts
                />
            </div>

            {/* Modal de Edición/Creación */}
            <ReusableModal
                title={editingItem ? "Editar Cuenta Contable" : "Nueva Cuenta Contable"}
                description="Complete la información de la cuenta contable."
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSave} className="space-y-4 px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Código</Label>
                            <Input
                                value={formData.codigo || ''}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                required
                                placeholder="Ej. 101-01-000"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Agrupador SAT</Label>
                            <Input
                                value={formData.codigo_agrupador || ''}
                                onChange={e => setFormData({ ...formData, codigo_agrupador: e.target.value })}
                                placeholder="Ej. 100.01"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            value={formData.nombre || ''}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            placeholder="Nombre descriptivo de la cuenta"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={formData.tipo} onValueChange={val => setFormData({ ...formData, tipo: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="PASIVO">Pasivo</SelectItem>
                                    <SelectItem value="CAPITAL">Capital</SelectItem>
                                    <SelectItem value="INGRESOS">Ingresos</SelectItem>
                                    <SelectItem value="COSTOS">Costos</SelectItem>
                                    <SelectItem value="GASTOS">Gastos</SelectItem>
                                    <SelectItem value="ORDEN">Orden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Naturaleza</Label>
                            <Select value={formData.naturaleza} onValueChange={val => setFormData({ ...formData, naturaleza: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DEUDORA">Deudora</SelectItem>
                                    <SelectItem value="ACREEDORA">Acreedora</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal de Confirmación de Borrado */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="¿Desactivar Cuenta?"
                description={`¿Estás seguro que deseas desactivar la cuenta "${itemToDelete?.codigo} - ${itemToDelete?.nombre}"? Esta acción no eliminará los movimientos históricos.`}
                confirmText="Desactivar"
                variant="destructive"
            />

            {/* Modal de Importación */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportar}
                onSuccess={() => {
                    loadData();
                    setIsImportModalOpen(false);
                    toast.success("Importación completada");
                }}
                templateUrl="/core/excel/exportar-plantilla/?model=CuentaContable" // Assumed generic endpoint or just use the export link
            />
        </div>
    );
}
