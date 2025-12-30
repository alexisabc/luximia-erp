'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Box, History, Plus, Loader2, AlertCircle,
    Clock, CheckCircle, DollarSign
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/organisms/Modal';
import { ActionButtonGroup } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { getCajas, createCaja, updateCaja, deleteCaja, getTurnos } from '@/services/pos';
import { useAuth } from '@/context/AuthContext';

export default function PosTurnosPage() {
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('cajas');
    const [cajas, setCajas] = useState([]);
    const [loadingCajas, setLoadingCajas] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', sucursal: '' });
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turnosData, setTurnosData] = useState({ results: [], count: 0 });
    const [turnosPage, setTurnosPage] = useState(1);
    const [turnosPageSize, setTurnosPageSize] = useState(10);
    const [loadingTurnos, setLoadingTurnos] = useState(false);

    const stats = [
        {
            label: 'Total Cajas',
            value: cajas.length || 0,
            icon: Box,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Turnos Abiertos',
            value: turnosData.results?.filter(t => !t.cerrado).length || 0,
            icon: Clock,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Turnos Cerrados',
            value: turnosData.results?.filter(t => t.cerrado).length || 0,
            icon: CheckCircle,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Diferencia Total',
            value: turnosData.results?.length > 0
                ? `$${turnosData.results.reduce((sum, t) => sum + parseFloat(t.diferencia || 0), 0).toFixed(2)}`
                : '$0.00',
            icon: DollarSign,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700',
            isAmount: true
        }
    ];

    const fetchCajas = useCallback(async () => {
        setLoadingCajas(true);
        try {
            const { data } = await getCajas();
            setCajas(data.results || data);
        } catch (error) {
            console.error(error);
            toast.error('Error cargando cajas');
        } finally {
            setLoadingCajas(false);
        }
    }, []);

    const fetchTurnos = useCallback(async (page, size) => {
        setLoadingTurnos(true);
        try {
            const { data } = await getTurnos(page, size);
            setTurnosData(data);
        } catch (error) {
            console.error(error);
            toast.error('Error cargando turnos');
        } finally {
            setLoadingTurnos(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'cajas') fetchCajas();
        if (activeTab === 'turnos') fetchTurnos(turnosPage, turnosPageSize);
    }, [activeTab, fetchCajas, fetchTurnos, turnosPage, turnosPageSize]);

    const handleSaveCaja = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateCaja(editingId, formData);
                toast.success('Caja actualizada exitosamente');
            } else {
                await createCaja(formData);
                toast.success('Caja creada exitosamente');
            }
            setIsFormOpen(false);
            fetchCajas();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar la caja');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCaja = async () => {
        if (!deletingId) return;
        try {
            await deleteCaja(deletingId);
            toast.success('Caja eliminada exitosamente');
            setIsDeleteOpen(false);
            fetchCajas();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar la caja');
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({ nombre: '', sucursal: 'Matriz' });
        setIsFormOpen(true);
    };

    const openEdit = (row) => {
        setEditingId(row.id);
        setFormData({ nombre: row.nombre, sucursal: row.sucursal });
        setIsFormOpen(true);
    };

    const openDelete = (row) => {
        setDeletingId(row.id);
        setIsDeleteOpen(true);
    };

    const cajasColumns = [
        {
            header: 'Caja',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                        <Box className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.nombre}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.sucursal || 'Sin sucursal'}</div>
                    </div>
                </div>
            )
        }
    ];

    const turnosColumns = [
        {
            header: 'Turno',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${row.cerrado ? 'from-gray-400 to-gray-600' : 'from-blue-500 to-indigo-600'} flex items-center justify-center text-white font-bold text-sm`}>
                        #{row.id}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.usuario_nombre || `User #${row.usuario}`}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.caja_nombre || `Caja #${row.caja}`}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Período',
            render: (row) => (
                <div className="text-sm">
                    <div className="text-gray-700 dark:text-gray-300">{new Date(row.fecha_inicio).toLocaleString()}</div>
                    <div className="text-gray-500 dark:text-gray-400">{row.fecha_fin ? new Date(row.fecha_fin).toLocaleString() : 'En curso'}</div>
                </div>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <Badge className={row.cerrado ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}>
                    {row.cerrado ? 'CERRADO' : 'ABIERTO'}
                </Badge>
            )
        },
        {
            header: 'Diferencia',
            render: (row) => (
                <span className={`font-bold ${row.diferencia < 0 ? 'text-red-500' : row.diferencia > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                    ${Number(row.diferencia || 0).toFixed(2)}
                </span>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Cajas y Turnos
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Configuración de cajas y auditoría de turnos (POS)
                        </p>
                    </div>
                    {activeTab === 'cajas' && (
                        <ActionButtonGroup onCreate={openCreate} canCreate={true} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                <button onClick={() => setActiveTab('cajas')} className={`pb-3 px-2 text-sm font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${activeTab === 'cajas' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                    <Box className="w-4 h-4" />
                    Cajas Físicas
                </button>
                <button onClick={() => setActiveTab('turnos')} className={`pb-3 px-2 text-sm font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${activeTab === 'turnos' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                    <History className="w-4 h-4" />
                    Historial de Turnos
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    {activeTab === 'cajas' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DataTable data={cajas} columns={cajasColumns} loading={loadingCajas} actions={{ onEdit: openEdit, onDelete: openDelete }} emptyMessage="No hay cajas configuradas" />
                        </div>
                    )}
                    {activeTab === 'turnos' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DataTable data={turnosData.results} columns={turnosColumns} loading={loadingTurnos} pagination={{ currentPage: turnosPage, totalCount: turnosData.count, pageSize: turnosPageSize, onPageChange: setTurnosPage }} emptyMessage="No hay turnos registrados" />
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? "Editar Caja" : "Nueva Caja"} size="md">
                <form onSubmit={handleSaveCaja} className="space-y-4">
                    <div>
                        <Label htmlFor="nombre">Nombre de la Caja <span className="text-red-500">*</span></Label>
                        <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Caja 1" required className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="sucursal">Sucursal</Label>
                        <Input id="sucursal" value={formData.sucursal} onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })} placeholder="Ej: Matriz" className="mt-1" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Caja" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas eliminar esta caja?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteCaja}>Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
