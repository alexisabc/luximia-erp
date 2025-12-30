'use client';

/**
 * Página de Gestión de Clientes - CLEAN ARCHITECTURE & ATOMIC DESIGN v3.5
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, UserCheck, UserX, Mail, Phone } from 'lucide-react';

// Atomic Design
import ListPageTemplate from '@/components/templates/ListPageTemplate';
import DataTable from '@/components/organisms/DataTable';
import Modal, { ConfirmModal } from '@/components/organisms/Modal';
import { StatCard, ActionButtonGroup, FormField } from '@/components/molecules';
import { Button, Heading, Text, Avatar } from '@/components/atoms';
import { Badge } from '@/components/ui/badge';

// Hooks & Services
import useResource from '@/hooks/useResource';
import { useAuth } from '@/context/AuthContext';
import {
    getClientes, createCliente, updateCliente, deleteCliente,
    getInactiveClientes, hardDeleteCliente, exportClientesExcel, importarClientes,
} from '@/services/api';

// Modales Legacy
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const CLIENTE_COLUMNAS = [
    {
        header: 'Nombre Completo',
        accessorKey: 'nombre_completo',
        cell: (row) => (
            <div className="flex items-center gap-3">
                <Avatar size="sm" fallback={row.nombre_completo?.charAt(0)?.toUpperCase() || 'C'} />
                <Text size="base" className="font-medium text-gray-900 dark:text-gray-100">
                    {row.nombre_completo}
                </Text>
            </div>
        )
    },
    {
        header: 'Contacto',
        accessorKey: 'email',
        cell: (row) => (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <Text size="sm" variant="muted">{row.email || '-'}</Text>
                </div>
                {row.telefono && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <Text size="sm" variant="muted">{row.telefono}</Text>
                    </div>
                )}
            </div>
        )
    },
    {
        header: 'Estado',
        accessorKey: 'activo',
        cell: (row) => (
            <Badge variant={row.activo ? 'success' : 'secondary'}>
                {row.activo ? 'Activo' : 'Inactivo'}
            </Badge>
        )
    }
];

const CLIENTE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'activo', label: 'Estado' }
];

export default function ClientesPage() {
    const { hasPermission } = useAuth();

    // UI States
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ nombre_completo: '', email: '', telefono: '' });
    const [editingCliente, setEditingCliente] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Export State
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        CLIENTE_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    // --- CLEAN CODE: HOOK useResource ---
    const fetcher = useCallback((page, pageSize, filters) => {
        const apiCall = showInactive ? getInactiveClientes : getClientes;
        return apiCall(page, pageSize, filters);
    }, [showInactive]);

    const {
        data, loading, pagination,
        onPageChange, onSearch, refresh, handleDelete: deleteResource
    } = useResource(fetcher, deleteCliente);

    // --- Handlers ---
    const handleCreateClick = () => {
        setEditingCliente(null);
        setFormData({ nombre_completo: '', email: '', telefono: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (cliente) => {
        setEditingCliente(cliente);
        setFormData({
            nombre_completo: cliente.nombre_completo,
            email: cliente.email || '',
            telefono: cliente.telefono || ''
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteRequest = (cliente) => {
        setItemToDelete(cliente);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        await deleteResource(itemToDelete.id);
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteCliente(id);
            toast.success('Eliminado permanentemente');
            refresh();
        } catch (e) { /* interceptor */ }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, formData);
                toast.success('Actualizado correctamente');
            } else {
                await createCliente(formData);
                toast.success('Creado correctamente');
            }
            setIsFormModalOpen(false);
            refresh();
        } catch (error) {
            // Interceptor maneja error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ListPageTemplate
            title={<Heading level={2}>Gestión de Clientes</Heading>}
            description={<Text variant="muted">Directorio y administración de clientes</Text>}
            onSearch={onSearch}
            stats={
                <div className="grid-responsive">
                    <StatCard title="Total" value={pagination.total} icon={Users} variant="primary" />
                    <StatCard title="Activos" value={data.filter(c => c.activo).length} icon={UserCheck} variant="success" />
                    <StatCard title="Inactivos" value={data.filter(c => !c.activo).length} icon={UserX} variant="warning" />
                    <StatCard title="Con Email" value={data.filter(c => c.email).length} icon={Mail} variant="info" />
                </div>
            }
            actions={
                <ActionButtonGroup
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    onCreate={handleCreateClick}
                    onImport={() => setIsImportModalOpen(true)}
                    onExport={() => setIsExportModalOpen(true)}
                    canCreate={hasPermission('contabilidad.add_cliente')}
                    canExport={hasPermission('contabilidad.view_cliente')}
                />
            }
        >
            <DataTable
                data={data}
                columns={CLIENTE_COLUMNAS}
                actions={{
                    onEdit: hasPermission('contabilidad.change_cliente') ? handleEditClick : null,
                    onDelete: hasPermission('contabilidad.delete_cliente') ? handleDeleteRequest : null,
                    onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null
                }}
                pagination={{
                    currentPage: pagination.page,
                    totalCount: pagination.total,
                    pageSize: pagination.pageSize,
                    onPageChange,
                }}
                loading={loading}
                onSearch={onSearch}
                mobileCardView={true}
                sortable={true}
            />

            {/* Modal Formulario */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>Guardar</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre Completo"
                        value={formData.nombre_completo}
                        onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        placeholder="Nombre completo"
                        required
                    />
                    <FormField
                        label="Email"
                        type="input"
                        inputType="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        required
                    />
                    <FormField
                        label="Teléfono"
                        type="input"
                        inputType="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="(555) 123-4567"
                    />
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Cliente"
                description={`¿Desactivar a ${itemToDelete?.nombre_completo}?`}
                confirmLabel="Desactivar"
                variant="warning"
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarClientes}
                onSuccess={() => { refresh(); toast.success('Importado'); }}
                templateUrl="/contabilidad/clientes/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={CLIENTE_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={(e) => setSelectedColumns(p => ({ ...p, [e.target.name]: e.target.checked }))}
                onDownload={async () => {
                    try {
                        const cols = CLIENTE_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
                        await exportClientesExcel(cols, { search: '' });
                        toast.success('Exportado');
                        setIsExportModalOpen(false);
                    } catch (e) { }
                }}
                data={data}
                withPreview={true}
            />
        </ListPageTemplate>
    );
}