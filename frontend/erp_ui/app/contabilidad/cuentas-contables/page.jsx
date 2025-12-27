'use client';

import React, { useState, useEffect } from 'react';
import { Upload } from 'antd';
import { Plus, Download, Upload as UploadIcon, Layers } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
            toast.error("Error cargando cuentas");
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

    const handleImport = async (file) => {
        const formData = new FormData();
        formData.append('archivo', file);
        try {
            await apiClient.post('/contabilidad/cuentas-contables/importar-excel/', formData);
            toast.success("Importación exitosa");
            loadData();
        } catch (e) {
            toast.error("Error importando");
        }
        return false;
    };

    const columns = [
        { header: 'Código', accessorKey: 'codigo', render: (row) => <span className="font-mono font-bold dark:text-white">{row.codigo}</span> },
        { header: 'Nombre', accessorKey: 'nombre', render: (row) => <span className="dark:text-gray-200">{row.nombre}</span> },
        { header: 'Tipo', accessorKey: 'tipo', render: (row) => <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{row.tipo}</span> },
        { header: 'Nivel', accessorKey: 'nivel', render: (row) => <span className="text-gray-500">{row.nivel}</span> },
        { header: 'Agrupador SAT', accessorKey: 'codigo_agrupador', render: (row) => <span className="text-xs text-gray-400">{row.codigo_agrupador}</span> },
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
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
                    <Upload beforeUpload={handleImport} showUploadList={false}>
                        <Button variant="outline" size="sm" className="gap-2"><UploadIcon size={16} /> Importar</Button>
                    </Upload>
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
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <Input
                            value={formData.nombre || ''}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={formData.tipo || ''}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                <option value="ACTIVO">Activo</option>
                                <option value="PASIVO">Pasivo</option>
                                <option value="CAPITAL">Capital</option>
                                <option value="INGRESOS">Ingresos</option>
                                <option value="EGRESOS">Egresos</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Naturaleza</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={formData.naturaleza || ''}
                                onChange={e => setFormData({ ...formData, naturaleza: e.target.value })}
                            >
                                <option value="DEUDORA">Deudora</option>
                                <option value="ACREEDORA">Acreedora</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Agrupador SAT</label>
                        <Input
                            value={formData.codigo_agrupador || ''}
                            onChange={e => setFormData({ ...formData, codigo_agrupador: e.target.value })}
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
