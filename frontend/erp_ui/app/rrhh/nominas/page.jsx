'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import moment from 'moment';

import { useAuth } from '@/context/AuthContext';
import { getNominas, deleteNomina, createNomina, getPeriodos } from '@/services/rrhh';
import ReusableTable from '@/components/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from "@/components/ui/badge";
import FormModal from '@/components/modals/Form';
import { Eye, FileText, Upload, CalendarRange } from 'lucide-react';

const NOMINA_FORM_FIELDS = [
    { name: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Ej. Nómina Quincenal 1 Enero 2025', required: true, span: 2 },
    { name: 'tipo', label: 'Tipo', type: 'select', options: ['ORDINARIA', 'EXTRAORDINARIA'], required: true },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true },
    { name: 'fecha_pago', label: 'Fecha Pago', type: 'date', required: true },
];

export default function NominasPage() {
    const { hasPermission } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [nominas, setNominas] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');
    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tipo: 'ORDINARIA',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
        fecha_pago: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0]
    });

    // Periodos calculation state
    const [periodos, setPeriodos] = useState([]);

    useEffect(() => {
        if (isCreateModalOpen) {
            getPeriodos({ activo: true, ordering: 'anio,tipo,numero' }).then(res => {
                setPeriodos(res.data.results || []);
            });
        }
    }, [isCreateModalOpen]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        let newData = { ...formData, [name]: value };

        if (name === 'periodo_id') {
            const p = periodos.find(x => x.id.toString() === value.toString());
            if (p) {
                const tipoMap = { 'SEMANAL': 'ORDINARIA', 'QUINCENAL': 'ORDINARIA' };
                // Auto-fill
                newData.fecha_inicio = p.fecha_inicio;
                newData.fecha_fin = p.fecha_fin;
                newData.fecha_pago = p.fecha_fin;
                newData.descripcion = `Nómina ${p.tipo.charAt(0) + p.tipo.slice(1).toLowerCase()} ${p.numero} de ${p.anio}`;
                newData.tipo = 'ORDINARIA'; // Default for periods
            }
        }
        setFormData(newData);
    };

    const dynamicFormFields = [
        {
            name: 'periodo_id',
            label: 'Cargar Periodo (Opcional)',
            type: 'select',
            options: periodos.map(p => ({ label: `${p.tipo} ${p.numero} - ${p.anio} (${moment(p.fecha_inicio).format('DD/MM')})`, value: p.id })),
            required: false,
            span: 2
        },
        ...NOMINA_FORM_FIELDS
    ];

    const fetchNominas = async () => {
        setLoading(true);
        try {
            const activeFilters = { ...filters, search };
            const response = await getNominas(page, pageSize, activeFilters);
            setNominas(response.data.results);
            setTotalItems(response.data.count);
        } catch (error) {
            toast.error("Error al cargar nóminas");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNominas();
    }, [page, pageSize, filters, search]);

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro que deseas eliminar esta nómina? La información se perderá.")) return;
        try {
            await deleteNomina(id);
            toast.success("Nómina eliminada");
            fetchNominas();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                razon_social: 1, // Default or dynamic if needed
                estado: 'BORRADOR'
            };
            await createNomina(payload);
            toast.success("Nómina creada exitosamente");
            setIsCreateModalOpen(false);
            setFormData({
                tipo: 'ORDINARIA',
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_fin: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
                fecha_pago: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0]
            });
            fetchNominas();
        } catch (error) {
            toast.error("Error al crear nómina");
            console.error(error);
        }
    };

    const columns = [
        { header: 'Descripción', accessorKey: 'descripcion', className: 'font-medium text-gray-900 dark:text-gray-100' },
        {
            header: 'Periodo',
            accessorKey: 'fecha_inicio',
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span>Del {moment(row.fecha_inicio).format('DD/MM/YYYY')}</span>
                    <span className="text-gray-500">Al {moment(row.fecha_fin).format('DD/MM/YYYY')}</span>
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => {
                const map = {
                    BORRADOR: 'secondary',
                    CALCULADA: 'warning',
                    TIMBRADA: 'success',
                    CANCELADA: 'destructive',
                };
                return <Badge variant={map[row.estado] || 'outline'}>{row.estado}</Badge>;
            }
        },
        {
            header: 'Total Neto',
            accessorKey: 'total_neto',
            cell: (row) => (
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(row.total_neto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
            )
        },
    ];

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Nóminas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de periodos y cálculos de pago.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/rrhh/nominas/historico')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        Histórico Centralizado
                    </button>
                    <button
                        onClick={() => router.push('/rrhh/nominas/importar')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Upload className="w-4 h-4" />
                        Importar Pagadora
                    </button>
                    <button
                        onClick={() => router.push('/rrhh/nominas/periodos')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <CalendarRange className="w-4 h-4" />
                        Gestionar Periodos
                    </button>
                    <ActionButtons
                        onCreate={() => setIsCreateModalOpen(true)}
                        canCreate={hasPermission('rrhh.add_nomina')}
                    />
                </div>
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={nominas}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        custom: hasPermission('rrhh.view_nomina') ? [
                            {
                                icon: Eye,
                                label: 'Ver Detalle',
                                onClick: (row) => router.push(`/rrhh/nominas/${row.id}`),
                                tooltip: 'Ver Detalle'
                            }
                        ] : [],
                        onDelete: hasPermission('rrhh.delete_nomina') ? handleDelete : null,
                    }}
                    pagination={{
                        currentPage: page,
                        totalCount: totalItems,
                        pageSize: pageSize,
                        onPageChange: setPage
                    }}
                />
            </div>

            <FormModal
                title="Nueva Nómina"
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                fields={dynamicFormFields}
                formData={formData}
                onFormChange={handleFormChange}
                submitText="Crear Nómina"
            />
        </div>
    );
}
