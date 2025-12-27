'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, Upload, Switch } from 'antd';
import { Plus, Download, Upload as UploadIcon, Package } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';

export default function InsumosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [monedas, setMonedas] = useState([]);
    const [form] = Form.useForm();
    const [search, setSearch] = useState('');

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
    }

    const handleSave = async (values) => {
        try {
            if (editingItem) {
                await apiClient.put(`/compras/insumos/${editingItem.id}/`, values);
                toast.success("Insumo actualizado");
            } else {
                await apiClient.post('/compras/insumos/', values);
                toast.success("Insumo creado");
            }
            setIsModalOpen(false);
            setEditingItem(null);
            form.resetFields();
            loadData();
        } catch (error) {
            toast.error("Error guardando");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro de desactivar?")) return;
        try {
            await apiClient.delete(`/compras/insumos/${id}/`);
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
        } catch (e) {
            toast.error("Error exportando");
        }
    };

    const handleImport = async (file) => {
        const formData = new FormData();
        formData.append('archivo', file);
        try {
            await apiClient.post('/compras/insumos/importar-excel/', formData);
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
        { header: 'Unidad', accessorKey: 'unidad_medida', render: (row) => <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{row.unidad_medida}</span> },
        { header: 'Costo', render: (row) => <span className="font-medium">${row.costo_unitario} {row.moneda?.codigo}</span> },
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-orange-600" />
                    Catálogo de Insumos
                </h1>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 mr-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Ver Inactivos</span>
                        <Switch checked={showInactive} onChange={setShowInactive} size="small" />
                    </div>
                    <Upload beforeUpload={handleImport} showUploadList={false}>
                        <Button icon={<UploadIcon size={16} />}>Importar</Button>
                    </Upload>
                    <Button icon={<Download size={16} />} onClick={handleExport}>Exportar</Button>
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }} className="bg-orange-600">Nuevo</Button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ReusableTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: (row) => { setEditingItem(row); form.setFieldsValue({ ...row, moneda: row.moneda?.id }); setIsModalOpen(true); },
                        onDelete: handleDelete
                    }}
                />
            </div>

            <Modal
                title={editingItem ? "Editar Insumo" : "Nuevo Insumo"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <div className="flex gap-4">
                        <Form.Item name="unidad_medida" label="Unidad" className="flex-1" rules={[{ required: true }]}>
                            <Input placeholder="PZA, KG..." />
                        </Form.Item>
                        <Form.Item name="costo_unitario" label="Costo" className="flex-1">
                            <InputNumber className="w-full" min={0} />
                        </Form.Item>
                    </div>
                    <Form.Item name="moneda" label="Moneda">
                        <Select>
                            {monedas.map(m => (
                                <Select.Option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
