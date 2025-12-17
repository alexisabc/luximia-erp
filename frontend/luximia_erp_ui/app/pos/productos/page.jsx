'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getProductosPOS, createProducto, updateProducto, deleteProducto
} from '@/services/pos';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from '@/components/ui/badge';

// ==================== CONFIG ====================
const COLUMNS = [
    {
        header: 'Color',
        accessorKey: 'color_ui',
        cell: (row) => (
            <div
                className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                style={{ backgroundColor: row.color_ui || '#3b82f6' }}
            />
        )
    },
    { header: 'Código', accessorKey: 'codigo', className: 'font-mono' },
    { header: 'Nombre', accessorKey: 'nombre', className: 'font-medium' },
    {
        header: 'Precio Lista',
        accessorKey: 'precio_lista',
        cell: (row) => `$${Number(row.precio_lista).toFixed(2)}`
    },
    {
        header: 'Unidad',
        accessorKey: 'unidad_medida',
        cell: (row) => <Badge variant="outline">{row.unidad_medida}</Badge>
    },
    {
        header: 'IVA %',
        accessorKey: 'impuestos_porcentaje',
        cell: (row) => `${row.impuestos_porcentaje}%`
    }
];

const FORM_FIELDS = [
    { name: 'codigo', label: 'Código (SKU)', required: true, placeholder: 'ej. ARENA-M3' },
    { name: 'nombre', label: 'Nombre del Producto', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    {
        name: 'unidad_medida',
        label: 'Unidad de Medida',
        type: 'select',
        options: [
            { value: 'M3', label: 'Metro Cúbico' },
            { value: 'TON', label: 'Tonelada' },
            { value: 'KG', label: 'Kilogramo' },
            { value: 'PZA', label: 'Pieza' },
            { value: 'VIAJE', label: 'Viaje' }
        ],
        required: true
    },
    { name: 'precio_lista', label: 'Precio Base ($)', type: 'number', required: true },
    { name: 'impuestos_porcentaje', label: 'Impuesto (%)', type: 'number', defaultValue: '16.00' },
    { name: 'color_ui', label: 'Color (Hex)', placeholder: '#3b82f6' }
];

export default function ProductosPage() {
    const { hasPermission } = useAuth(); // Check permissions if needed

    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProductosPOS(search);
            if (res.data.results) {
                setData(res.data);
            } else {
                setData({ results: res.data, count: res.data.length });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateProducto(editingId, formData);
            } else {
                await createProducto(formData);
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving product", error);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteProducto(deletingId);
            setIsDeleteOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting product", error);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({
            codigo: '', nombre: '', unidad_medida: 'M3',
            precio_lista: '', impuestos_porcentaje: '16.00', color_ui: '#3b82f6'
        });
        setIsFormOpen(true);
    };

    const openEdit = (row) => {
        setEditingId(row.id);
        setFormData({
            codigo: row.codigo,
            nombre: row.nombre,
            descripcion: row.descripcion,
            unidad_medida: row.unidad_medida,
            precio_lista: row.precio_lista,
            impuestos_porcentaje: row.impuestos_porcentaje,
            color_ui: row.color_ui
        });
        setIsFormOpen(true);
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Catálogo de Productos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de materiales y servicios para venta.</p>
                </div>
                <ActionButtons
                    onCreate={openCreate}
                    canCreate={true}
                />
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={data.results}
                    columns={COLUMNS}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        onEdit: openEdit,
                        onDelete: (id) => { setDeletingId(id); setIsDeleteOpen(true); }
                    }}
                    pagination={{
                        currentPage: page,
                        totalCount: data.count,
                        pageSize: pageSize,
                        onPageChange: setPage
                    }}
                />
            </div>

            <FormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? "Editar Producto" : "Nuevo Producto"}
                formData={formData}
                onFormChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                onSubmit={handleSave}
                fields={FORM_FIELDS}
                submitText="Guardar Producto"
            />

            <ConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Producto"
                message="¿Seguro que deseas eliminar este producto? No podrá recuperarse."
                confirmText="Eliminar"
            />
        </div>
    );
}
