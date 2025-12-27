'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Download, Upload as UploadIcon, Layers } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '@/services/api';
import { toast } from 'sonner';

export default function CuentasContablesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [search, setSearch] = useState('');

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
                toast.success("Cuenta actualizada");
            } else {
                await apiClient.post('/contabilidad/cuentas-contables/', formData);
                toast.success("Cuenta creada");
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({});
            loadData();
        } catch (error) {
            toast.error("Error guardando cuenta");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro de desactivar esta cuenta?")) return;
        try {
            await apiClient.delete(`/contabilidad/cuentas-contables/${id}/`);
            toast.success("Cuenta desactivada");
            loadData();
        } catch (error) {
            toast.error("Error desactivando");
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
            toast.success("Exportación descargada");
        } catch (e) {
            toast.error("Error exportando");
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('archivo', file);
        try {
            await apiClient.post('/contabilidad/cuentas-contables/importar-excel/', formData);
            toast.success("Importación exitosa");
            loadData();
        } catch (e) {
            toast.error("Error importando");
        }
        e.target.value = '';
    };

    const columns = [
        { header: 'Código', accessorKey: 'codigo', render: (row) => <span className="font-mono font-bold dark:text-white">{row.codigo}</span> },
        { header: 'Nombre', accessorKey: 'nombre', render: (row) => <span className="dark:text-gray-200">{row.nombre}</span> },
        { header: 'Tipo', accessorKey: 'tipo', render: (row) => <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{row.tipo}</span> },
        { header: 'Nivel', accessorKey: 'nivel', render: (row) => <span className="text-gray-500">{row.nivel}</span> },
        { header: 'Agrupador SAT', accessorKey: 'codigo_agrupador', render: (row) => <span className="text-xs text-gray-400">{row.codigo_agrupador}</span> },
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Layers className="text-blue-600" />
                    Catálogo de Cuentas
                </h1>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 mr-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Ver Inactivos</span>
                        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    </div>

                    <div className="relative">
                        <input type="file" id="import-acc-file" className="hidden" onChange={handleImport} accept=".xlsx,.xls" />
                        <label htmlFor="import-acc-file">
                            <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild>
                                <span><UploadIcon size={16} /> Importar</span>
                            </Button>
                        </label>
                    </div>

                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}><Download size={16} /> Exportar</Button>
                    <Button onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }} className="bg-blue-600 gap-2 hover:bg-blue-700"><Plus size={16} /> Nuevo</Button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ReusableTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: (row) => { setEditingItem(row); setFormData(row); setIsModalOpen(true); },
                        onDelete: handleDelete
                    }}
                />
            </div>

            <ReusableModal
                title={editingItem ? "Editar Cuenta" : "Nueva Cuenta"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Código</label>
                        <Input
                            value={formData.codigo || ''}
                            onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                            required
                            placeholder="Ej. 101-01"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <Input
                            value={formData.nombre || ''}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            placeholder="Caja General"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <Select value={formData.tipo} onValueChange={val => setFormData({ ...formData, tipo: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="PASIVO">Pasivo</SelectItem>
                                    <SelectItem value="CAPITAL">Capital</SelectItem>
                                    <SelectItem value="INGRESOS">Ingresos</SelectItem>
                                    <SelectItem value="EGRESOS">Egresos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Naturaleza</label>
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
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Agrupador SAT</label>
                        <Input
                            value={formData.codigo_agrupador || ''}
                            onChange={e => setFormData({ ...formData, codigo_agrupador: e.target.value })}
                            placeholder="Ej. 100.01"
                        />
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
