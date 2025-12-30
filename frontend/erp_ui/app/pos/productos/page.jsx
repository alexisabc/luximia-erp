'use client';

/**
 * Página de Catálogo de Productos - Actualizada v2.6
 * 
 * Características:
 * - ✅ Responsive (móvil → TV)
 * - ✅ Dark mode completo
 * - ✅ Stats cards con gradientes
 * - ✅ Toasts modernos (Sonner)
 * - ✅ Componentes reutilizables
 * - ✅ Iconos Lucide
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Package, Plus, Loader2, DollarSign,
    TrendingUp, Palette, AlertCircle, Tag
} from 'lucide-react';

// Componentes
import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Servicios
import {
    getProductosPOS,
    createProducto,
    updateProducto,
    deleteProducto
} from '@/services/pos';
import { useAuth } from '@/context/AuthContext';

const COLUMNS = [
    {
        header: 'Producto',
        accessorKey: 'nombre',
        cell: (row) => (
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: row.color_ui || '#3b82f6' }}
                >
                    <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {row.codigo}
                    </div>
                </div>
            </div>
        )
    },
    {
        header: 'Precio Lista',
        accessorKey: 'precio_lista',
        cell: (row) => (
            <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                    ${Number(row.precio_lista).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                    +{row.impuestos_porcentaje}% IVA
                </div>
            </div>
        )
    },
    {
        header: 'Unidad',
        accessorKey: 'unidad_medida',
        cell: (row) => (
            <Badge variant="outline" className="font-medium">
                {row.unidad_medida}
            </Badge>
        )
    }
];

export default function ProductosPage() {
    const { hasPermission } = useAuth();

    // Estados
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');

    // Modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estadísticas calculadas
    const stats = [
        {
            label: 'Total Productos',
            value: data.count || 0,
            icon: Package,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Precio Promedio',
            value: data.results.length > 0
                ? `$${(data.results.reduce((sum, p) => sum + parseFloat(p.precio_lista || 0), 0) / data.results.length).toFixed(2)}`
                : '$0.00',
            icon: DollarSign,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
            isAmount: true
        },
        {
            label: 'Unidades Diferentes',
            value: new Set(data.results.map(p => p.unidad_medida)).size || 0,
            icon: Tag,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Con Color',
            value: data.results.filter(p => p.color_ui).length || 0,
            icon: Palette,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    // Cargar datos
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
            toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingId) {
                await updateProducto(editingId, formData);
                toast.success('Producto actualizado exitosamente');
            } else {
                await createProducto(formData);
                toast.success('Producto creado exitosamente');
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving product", error);
            toast.error('Error al guardar producto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteProducto(deletingId);
            toast.success('Producto eliminado exitosamente');
            setIsDeleteOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting product", error);
            toast.error('Error al eliminar producto');
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({
            codigo: '',
            nombre: '',
            descripcion: '',
            unidad_medida: 'M3',
            precio_lista: '',
            impuestos_porcentaje: '16.00',
            color_ui: '#3b82f6'
        });
        setIsFormOpen(true);
    };

    const openEdit = (row) => {
        setEditingId(row.id);
        setFormData({
            codigo: row.codigo,
            nombre: row.nombre,
            descripcion: row.descripcion || '',
            unidad_medida: row.unidad_medida,
            precio_lista: row.precio_lista,
            impuestos_porcentaje: row.impuestos_porcentaje,
            color_ui: row.color_ui || '#3b82f6'
        });
        setIsFormOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Catálogo de Productos
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Gestión de materiales y servicios para venta
                        </p>
                    </div>

                    <ActionButtonGroup
                        onCreate={openCreate}
                        canCreate={true}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`
                                bg-gradient-to-br ${stat.gradient}
                                rounded-xl p-4 sm:p-6
                                shadow-lg hover:shadow-xl
                                transition-all duration-300
                                transform hover:-translate-y-1
                            `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                            </div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm text-white/80">
                                {stat.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <DataTable
                        data={data.results}
                        columns={COLUMNS}
                        loading={loading}
                        onSearch={setSearch}
                        actions={{
                            onEdit: openEdit,
                            onDelete: (row) => {
                                setDeletingId(row.id);
                                setIsDeleteOpen(true);
                            }
                        }}
                        pagination={{
                            currentPage: page,
                            totalCount: data.count,
                            pageSize: pageSize,
                            onPageChange: setPage
                        }}
                        emptyMessage="No hay productos disponibles"
                    />
                </div>
            </div>

            {/* Modal de Formulario */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? "Editar Producto" : "Nuevo Producto"}
                size="lg"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    {/* Grid de 2 columnas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Código */}
                        <div>
                            <Label htmlFor="codigo">
                                Código (SKU) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="codigo"
                                name="codigo"
                                value={formData.codigo || ''}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="ej. ARENA-M3"
                                required
                                className="mt-1"
                            />
                        </div>

                        {/* Unidad de Medida */}
                        <div>
                            <Label htmlFor="unidad_medida">
                                Unidad de Medida <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.unidad_medida || 'M3'}
                                onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M3">Metro Cúbico</SelectItem>
                                    <SelectItem value="TON">Tonelada</SelectItem>
                                    <SelectItem value="KG">Kilogramo</SelectItem>
                                    <SelectItem value="PZA">Pieza</SelectItem>
                                    <SelectItem value="VIAJE">Viaje</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nombre */}
                        <div className="sm:col-span-2">
                            <Label htmlFor="nombre">
                                Nombre del Producto <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                value={formData.nombre || ''}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Nombre descriptivo"
                                required
                                className="mt-1"
                            />
                        </div>

                        {/* Descripción */}
                        <div className="sm:col-span-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion || ''}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Descripción del producto"
                                rows={3}
                                className="mt-1"
                            />
                        </div>

                        {/* Precio Lista */}
                        <div>
                            <Label htmlFor="precio_lista">
                                Precio Base ($) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="precio_lista"
                                name="precio_lista"
                                type="number"
                                step="0.01"
                                value={formData.precio_lista || ''}
                                onChange={(e) => setFormData({ ...formData, precio_lista: e.target.value })}
                                placeholder="0.00"
                                required
                                className="mt-1"
                            />
                        </div>

                        {/* Impuesto */}
                        <div>
                            <Label htmlFor="impuestos_porcentaje">Impuesto (%)</Label>
                            <Input
                                id="impuestos_porcentaje"
                                name="impuestos_porcentaje"
                                type="number"
                                step="0.01"
                                value={formData.impuestos_porcentaje || '16.00'}
                                onChange={(e) => setFormData({ ...formData, impuestos_porcentaje: e.target.value })}
                                placeholder="16.00"
                                className="mt-1"
                            />
                        </div>

                        {/* Color UI */}
                        <div>
                            <Label htmlFor="color_ui">Color (Hex)</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    id="color_ui"
                                    name="color_ui"
                                    type="text"
                                    value={formData.color_ui || '#3b82f6'}
                                    onChange={(e) => setFormData({ ...formData, color_ui: e.target.value })}
                                    placeholder="#3b82f6"
                                    className="flex-1"
                                />
                                <div
                                    className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                                    style={{ backgroundColor: formData.color_ui || '#3b82f6' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Producto'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmación */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Eliminar Producto"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                ¿Seguro que deseas eliminar este producto?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
