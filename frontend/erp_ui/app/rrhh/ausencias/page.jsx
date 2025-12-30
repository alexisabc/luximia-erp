'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Calendar, Plus, Loader2, UserX,
    TrendingUp, AlertCircle, Clock
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import apiClient from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function AusenciasPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [empleados, setEmpleados] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        empleado: '', tipo: 'Enfermedad', fecha_inicio: '', fecha_fin: '', motivo: '', justificada: true
    });
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total Ausencias',
            value: pageData.count || 0,
            icon: Calendar,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Justificadas',
            value: pageData.results?.filter(a => a.justificada).length || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Sin Justificar',
            value: pageData.results?.filter(a => !a.justificada).length || 0,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Este Mes',
            value: pageData.results?.filter(a => {
                const fecha = new Date(a.fecha_inicio);
                const hoy = new Date();
                return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
            }).length || 0,
            icon: Clock,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        }
    ];

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const params = { page, page_size: size, search, show_inactive: showInactive };
            const [ausenciasRes, empleadosRes] = await Promise.all([
                apiClient.get('/rrhh/ausencias/', { params }),
                apiClient.get('/rrhh/empleados/')
            ]);
            setPageData(ausenciasRes.data);
            setEmpleados(empleadosRes.data.results || empleadosRes.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando ausencias');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingItem(null);
        setFormData({
            empleado: '', tipo: 'Enfermedad', fecha_inicio: '', fecha_fin: '', motivo: '', justificada: true
        });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setFormData({
            empleado: item.empleado,
            tipo: item.tipo,
            fecha_inicio: item.fecha_inicio,
            fecha_fin: item.fecha_fin,
            motivo: item.motivo || '',
            justificada: item.justificada
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingItem) {
                await apiClient.put(`/rrhh/ausencias/${editingItem.id}/`, formData);
                toast.success('Ausencia actualizada exitosamente');
            } else {
                await apiClient.post('/rrhh/ausencias/', formData);
                toast.success('Ausencia registrada exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar la ausencia');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await apiClient.delete(`/rrhh/ausencias/${itemToDelete.id}/`);
            toast.success('Ausencia eliminada exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar la ausencia');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const columns = [
        {
            header: 'Empleado',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                        <UserX className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            {row.empleado_nombre || `Empleado #${row.empleado}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.tipo}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Período',
            render: (row) => (
                <div className="text-sm">
                    <div className="text-gray-700 dark:text-gray-300">
                        {new Date(row.fecha_inicio).toLocaleDateString()} - {new Date(row.fecha_fin).toLocaleDateString()}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {Math.ceil((new Date(row.fecha_fin) - new Date(row.fecha_inicio)) / (1000 * 60 * 60 * 24)) + 1} días
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.justificada ? 'success' : 'destructive'}>
                    {row.justificada ? 'Justificada' : 'Sin Justificar'}
                </Badge>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Gestión de Ausencias
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Registro y control de ausencias del personal
                        </p>
                    </div>
                    <ActionButtonGroup
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('rrhh.view_ausencia')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('rrhh.add_ausencia')}
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
                        data={pageData.results}
                        columns={columns}
                        actions={{
                            onEdit: hasPermission('rrhh.change_ausencia') ? handleEditClick : null,
                            onDelete: hasPermission('rrhh.delete_ausencia') ? handleDeleteClick : null
                        }}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay ausencias registradas"
                    />
                </div>
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingItem ? 'Editar Ausencia' : 'Nueva Ausencia'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Label htmlFor="empleado">Empleado <span className="text-red-500">*</span></Label>
                            <Select value={formData.empleado?.toString()} onValueChange={(value) => setFormData({ ...formData, empleado: value })}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione empleado" /></SelectTrigger>
                                <SelectContent>
                                    {empleados.map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.nombres} {e.apellido_paterno}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
                            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Enfermedad">Enfermedad</SelectItem>
                                    <SelectItem value="Permiso Personal">Permiso Personal</SelectItem>
                                    <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                                    <SelectItem value="Incapacidad">Incapacidad</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="justificada">Estado</Label>
                            <Select value={formData.justificada ? 'true' : 'false'} onValueChange={(value) => setFormData({ ...formData, justificada: value === 'true' })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Justificada</SelectItem>
                                    <SelectItem value="false">Sin Justificar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="fecha_inicio">Fecha Inicio <span className="text-red-500">*</span></Label>
                            <Input id="fecha_inicio" type="date" value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="fecha_fin">Fecha Fin <span className="text-red-500">*</span></Label>
                            <Input id="fecha_fin" type="date" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} required className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="motivo">Motivo</Label>
                            <Textarea id="motivo" value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} placeholder="Descripción del motivo" rows={3} className="mt-1" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar Ausencia')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Eliminar Ausencia" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas eliminar este registro de ausencia?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
