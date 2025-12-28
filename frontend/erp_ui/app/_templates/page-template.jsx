'use client';

/**
 * Template de Página Estándar - Sistema ERP v2.6
 * 
 * Este template incluye:
 * - ✅ Estructura responsive (móvil, tablet, laptop, desktop, TV)
 * - ✅ Dark mode completo
 * - ✅ Componentes reutilizables
 * - ✅ Toasts modernos (Sonner)
 * - ✅ Iconos consistentes (Lucide)
 * - ✅ Gradientes y animaciones
 * - ✅ Accesibilidad
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Plus,
    Loader2,
    Search,
    Download,
    Upload,
    Edit,
    Trash2,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

// Componentes reutilizables
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';

// Componentes UI base
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Servicios API
import apiClient from '@/services/api';

export default function TemplatePage() {
    // ==================== ESTADOS ====================
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ==================== FORM ====================
    const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    // ==================== EFFECTS ====================
    useEffect(() => {
        loadData();
    }, [currentPage, searchTerm]);

    // ==================== FUNCIONES ====================
    const loadData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/endpoint/', {
                params: {
                    page: currentPage,
                    search: searchTerm
                }
            });
            setData(response.data.results || response.data);
            setTotalPages(Math.ceil(response.data.count / 10));
        } catch (error) {
            console.error(error);
            toast.error('Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        reset();
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        // Llenar formulario con datos del item
        Object.keys(item).forEach(key => {
            setValue(key, item[key]);
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

        try {
            await apiClient.delete(`/api/endpoint/${item.id}/`);
            toast.success('Elemento eliminado exitosamente');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error eliminando elemento');
        }
    };

    const onSubmit = async (formData) => {
        try {
            if (selectedItem) {
                // Actualizar
                await apiClient.put(`/api/endpoint/${selectedItem.id}/`, formData);
                toast.success('Elemento actualizado exitosamente');
            } else {
                // Crear
                await apiClient.post('/api/endpoint/', formData);
                toast.success('Elemento creado exitosamente');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error guardando elemento');
        }
    };

    // ==================== CONFIGURACIÓN DE TABLA ====================
    const columns = [
        {
            header: 'ID',
            render: (row) => (
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    #{row.id}
                </span>
            )
        },
        {
            header: 'Nombre',
            render: (row) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    {row.nombre}
                </span>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.activo ? 'success' : 'secondary'}>
                    {row.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        }
    ];

    // ==================== ESTADÍSTICAS (OPCIONAL) ====================
    const stats = [
        {
            label: 'Total',
            value: data.length,
            icon: CheckCircle,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700',
            change: '+12%'
        },
        {
            label: 'Activos',
            value: data.filter(item => item.activo).length,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
            change: '+5%'
        },
        {
            label: 'Inactivos',
            value: data.filter(item => !item.activo).length,
            icon: TrendingDown,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700',
            change: '-3%'
        },
        {
            label: 'Pendientes',
            value: 0,
            icon: AlertCircle,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            change: '0%'
        }
    ];

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* ========== HEADER ========== */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Título de la Página
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Descripción breve de la funcionalidad
                </p>
            </div>

            {/* ========== STATS CARDS (OPCIONAL) ========== */}
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
                                <span className="text-xs sm:text-sm font-medium text-white/70">
                                    {stat.change}
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm text-white/80">
                                {stat.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Nuevo</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Exportar</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Importar</span>
                        </Button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <ReusableTable
                        columns={columns}
                        data={data}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        emptyMessage="No hay datos disponibles"
                    />
                </div>

                {/* Paginación (si es necesaria) */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-300">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </div>

            {/* ========== MODAL DE FORMULARIO ========== */}
            <ReusableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedItem ? 'Editar Elemento' : 'Nuevo Elemento'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Campo de ejemplo */}
                    <div>
                        <Label htmlFor="nombre">
                            Nombre <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre"
                            {...register('nombre', { required: 'Este campo es requerido' })}
                            placeholder="Ingrese el nombre"
                            className="mt-1"
                        />
                        {errors.nombre && (
                            <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
                        )}
                    </div>

                    {/* Select de ejemplo */}
                    <div>
                        <Label htmlFor="tipo">Tipo</Label>
                        <Controller
                            name="tipo"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Seleccione un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tipo1">Tipo 1</SelectItem>
                                        <SelectItem value="tipo2">Tipo 2</SelectItem>
                                        <SelectItem value="tipo3">Tipo 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Botones del formulario */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
