'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import moment from 'moment';

import { getNominas, deleteNomina } from '@/services/rrhh';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from "@/components/ui/badge";
import { Eye } from 'lucide-react';

export default function NominasPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [nominas, setNominas] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');

    const fetchNominas = async () => {
        setLoading(true);
        try {
            // Adjust API call to support search if filters doesn't handle it same way 
            // Assuming filters object can take search
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
                <ActionButtons
                    onCreate={() => router.push('/rrhh/nominas/crear')}
                    canCreate={true}
                />
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={nominas}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        custom: [
                            {
                                icon: Eye,
                                label: 'Ver Detalle',
                                onClick: (row) => router.push(`/rrhh/nominas/${row.id}`),
                                tooltip: 'Ver Detalle'
                            }
                        ],
                        onDelete: (id) => handleDelete(id),
                        // Note: onDelete in ReusableTable usually triggers a callback with ID. 
                        // Logic for "Only if BORRADOR" checks might need to be inside ReusableTable actions render 
                        // or acceptable to just show delete and fail/warn if not allowed. 
                        // ReusableTable ideally should support per-row action enabling.
                        // Assuming basic usage here.
                    }}
                    pagination={{
                        currentPage: page,
                        totalCount: totalItems,
                        pageSize: pageSize,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    );
}
