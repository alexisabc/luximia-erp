'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getCajas, createCaja, updateCaja, deleteCaja,
    getTurnos
} from '@/services/pos';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ReusableTable from '@/components/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Box, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ==================== CONFIG CAJAS ====================
const CAJA_COLUMNS = [
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Sucursal', accessorKey: 'sucursal' },
];

const CAJA_FORM_FIELDS = [
    { name: 'nombre', label: 'Nombre de la Caja', required: true },
    { name: 'sucursal', label: 'Sucursal', required: false },
];

// ==================== CONFIG TURNOS ====================
const TURNO_COLUMNS = [
    { header: 'ID', accessorKey: 'id', className: 'w-16' },
    {
        header: 'Cajero',
        accessorKey: 'usuario_nombre',
        cell: (row) => <span className="font-medium">{row.usuario_nombre || `User #${row.usuario}`}</span>
    },
    {
        header: 'Caja',
        accessorKey: 'caja_nombre',
        cell: (row) => row.caja_nombre || `Caja #${row.caja}`
    },
    {
        header: 'Inicio',
        accessorKey: 'fecha_inicio',
        cell: (row) => new Date(row.fecha_inicio).toLocaleString()
    },
    {
        header: 'Fin',
        accessorKey: 'fecha_fin',
        cell: (row) => row.fecha_fin ? new Date(row.fecha_fin).toLocaleString() : '--'
    },
    {
        header: 'Estado',
        accessorKey: 'cerrado',
        cell: (row) => (
            <Badge className={row.cerrado ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-none" : "bg-green-600 text-white hover:bg-green-700 border-none"}>
                {row.cerrado ? 'CERRADO' : 'ABIERTO'}
            </Badge>
        )
    },
    {
        header: 'Diferencia',
        accessorKey: 'diferencia',
        cell: (row) => (
            <span className={row.diferencia < 0 ? 'text-red-500 font-bold' : row.diferencia > 0 ? 'text-green-500' : 'text-gray-500'}>
                ${Number(row.diferencia || 0).toFixed(2)}
            </span>
        )
    }
];

export default function PosTurnosPage() {
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('cajas'); // 'cajas' | 'turnos'

    // ==================== STATE CAJAS ====================
    const [cajas, setCajas] = useState([]);
    const [loadingCajas, setLoadingCajas] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', sucursal: '' });
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // ==================== STATE TURNOS ====================
    const [turnosData, setTurnosData] = useState({ results: [], count: 0 });
    const [turnosPage, setTurnosPage] = useState(1);
    const [turnosPageSize, setTurnosPageSize] = useState(10);
    const [loadingTurnos, setLoadingTurnos] = useState(false);

    // ==================== FETCH DATA ====================
    const fetchCajas = useCallback(async () => {
        setLoadingCajas(true);
        try {
            const { data } = await getCajas();
            setCajas(data.results || data);
        } catch (error) {
            console.error(error);
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
        } finally {
            setLoadingTurnos(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'cajas') fetchCajas();
        if (activeTab === 'turnos') fetchTurnos(turnosPage, turnosPageSize);
    }, [activeTab, fetchCajas, fetchTurnos, turnosPage, turnosPageSize]);

    // ==================== HANDLERS CAJAS ====================
    const handleSaveCaja = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCaja(editingId, formData);
            } else {
                await createCaja(formData);
            }
            setIsFormOpen(false);
            fetchCajas();
        } catch (error) {
            console.error("Error saving caja", error);
        }
    };

    const handleDeleteCaja = async () => {
        if (!deletingId) return;
        try {
            await deleteCaja(deletingId);
            setIsDeleteOpen(false);
            fetchCajas();
        } catch (error) {
            console.error("Error deleting caja", error);
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

    const openDelete = (id) => {
        setDeletingId(id);
        setIsDeleteOpen(true);
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Cajas y Turnos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configuración de cajas y auditoría de turnos (POS).</p>
                </div>
                {activeTab === 'cajas' ? (
                    <ActionButtons
                        onCreate={openCreate}
                        canCreate={true}
                    />
                ) : (
                    <div className="h-10"></div> /* Spacer if no actions for turnos yet */
                )}
            </div>

            {/* TABS */}
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('cajas')}
                    className={`pb-3 px-2 text-sm font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${activeTab === 'cajas'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Box className="w-4 h-4" />
                    Cajas Físicas
                </button>
                <button
                    onClick={() => setActiveTab('turnos')}
                    className={`pb-3 px-2 text-sm font-medium transition-all duration-200 border-b-2 flex items-center gap-2 ${activeTab === 'turnos'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <History className="w-4 h-4" />
                    Historial de Turnos
                </button>
            </div>

            <div className="flex-grow min-h-0">
                {activeTab === 'cajas' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ReusableTable
                            data={cajas}
                            columns={CAJA_COLUMNS}
                            loading={loadingCajas}
                            actions={{
                                onEdit: openEdit,
                                onDelete: (id) => openDelete(id)
                            }}
                        />
                    </div>
                )}

                {activeTab === 'turnos' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ReusableTable
                            data={turnosData.results}
                            columns={TURNO_COLUMNS}
                            loading={loadingTurnos}
                            pagination={{
                                currentPage: turnosPage,
                                totalCount: turnosData.count,
                                pageSize: turnosPageSize,
                                onPageChange: setTurnosPage
                            }}
                        />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <FormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? "Editar Caja" : "Nueva Caja"}
                formData={formData}
                onFormChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                onSubmit={handleSaveCaja}
                fields={CAJA_FORM_FIELDS}
                submitText="Guardar"
            />

            <ConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteCaja}
                title="Eliminar Caja"
                message="¿Estás seguro de que deseas eliminar esta caja? Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />
        </div>
    );
}
