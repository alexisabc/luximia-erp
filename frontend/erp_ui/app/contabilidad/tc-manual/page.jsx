'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, DatePicker, Select } from 'antd';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Banknote } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import dayjs from 'dayjs';

export default function TiposCambioManualPage() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [monedas, setMonedas] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
        loadMonedas();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/tipos-cambio-manual/');
            setRates(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando tipos de cambio");
        } finally {
            setLoading(false);
        }
    };

    const loadMonedas = async () => {
        try {
            const res = await apiClient.get('/contabilidad/monedas/'); // Verify endpoint
            setMonedas(res.data.results || res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async (values) => {
        try {
            const payload = {
                ...values,
                fecha: values.fecha.format('YYYY-MM-DD'),
                moneda: values.moneda // ID
            };
            await apiClient.post('/tipos-cambio-manual/', payload);
            toast.success("Tipo de cambio guardado");
            setIsModalOpen(false);
            form.resetFields();
            loadData();
        } catch (error) {
            toast.error("Error guardando");
        }
    };

    const columns = [
        { header: 'Fecha', accessorKey: 'fecha', render: (row) => <span className="dark:text-gray-300">{row.fecha}</span> },
        { header: 'Moneda Origen', render: (row) => <span className="font-bold dark:text-white">{row.moneda_origen?.codigo || 'USD'}</span> },
        { header: 'Moneda Destino', render: (row) => <span className="text-gray-500 dark:text-gray-400">{row.moneda_destino?.codigo || 'MXN'}</span> },
        { header: 'T.C.', accessorKey: 'valor', render: (row) => <span className="font-mono text-blue-600 dark:text-blue-400">${row.valor}</span> },
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Banknote className="text-green-600" />
                    Tipos de Cambio Manuales
                </h1>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-500/30"
                >
                    Nuevo T.C.
                </Button>
            </div>

            <div className="flex-1 min-h-0">
                <ReusableTable
                    data={rates}
                    columns={columns}
                    loading={loading}
                    actions={{
                        onDelete: (id) => toast.info("Función de borrar pendiente")
                    }}
                />
            </div>

            <Modal
                title="Registrar Tipo de Cambio"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="fecha" label="Fecha" rules={[{ required: true }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item name="moneda" label="Moneda Extranjera" rules={[{ required: true }]}>
                        <Select>
                            {monedas.map(m => (
                                <Select.Option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="valor" label="Valor en MXN" rules={[{ required: true }]}>
                        <InputNumber className="w-full" precision={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
