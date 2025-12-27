'use client';

import React, { useState, useEffect } from 'react';
import { Upload } from 'antd';
import { Plus, Download, Upload as UploadIcon, Building2 } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';

export default function CentrosCostosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [search, setSearch] = useState('');

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
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        try {
            if (editingItem) {
                await apiClient.put(`/contabilidad/centros-costos/${editingItem.id}/`, values);
                toast.success("Centro actualizado");
            } else {
                await apiClient.post('/contabilidad/centros-costos/', values);
                toast.success("Centro creado");
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
            await apiClient.delete(`/contabilidad/centros-costos/${id}/`);
            toast.success("Desactivado");
            loadData();
        } catch (error) {
            toast.error("Error desactivando");
        }
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
        } catch (e) {
            toast.error("Error exportando");
        }
    };

    const handleImport = async (file) => {
        const formData = new FormData();
        formData.append('archivo', file);
        try {
            await apiClient.post('/contabilidad/centros-costos/importar-excel/', formData);
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
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="text-purple-600" />
                    Centros de Costos
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
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }} className="bg-purple-600">Nuevo</Button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ReusableTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: (row) => { setEditingItem(row); form.setFieldsValue(row); setIsModalOpen(true); },
                        onDelete: handleDelete
                    }}
                />
            </div>

            <Modal
                title={editingItem ? "Editar Centro" : "Nuevo Centro"}
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
                </Form>
            </Modal>
        </div>
    );
}
