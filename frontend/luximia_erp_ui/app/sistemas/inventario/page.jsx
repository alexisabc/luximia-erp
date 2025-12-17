'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Monitor, Laptop, Users
} from 'lucide-react';
import { toast } from 'sonner';

import { getActivosIT } from '@/services/sistemas';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from '@/components/ui/badge';

export default function InventarioSistemasPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activos, setActivos] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');

    const fetchActivos = async () => {
        setLoading(true);
        try {
            const { data } = await getActivosIT(page, pageSize, { search });
            setActivos(data.results);
            setTotalItems(data.count);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar inventario");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivos();
    }, [page, pageSize, search]);

    const columns = [
        {
            header: 'Activo',
            accessorKey: 'modelo_nombre',
            cell: r => (
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        {r.categoria_nombre?.includes('Lap') ? <Laptop className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{r.modelo_nombre}</p>
                        <p className="text-xs text-muted-foreground">{r.numero_serie}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: r => {
                const map = {
                    DISPONIBLE: 'success',
                    ASIGNADO: 'secondary',
                    MANTENIMIENTO: 'warning',
                    BAJA: 'destructive'
                };
                return <Badge variant={map[r.estado] || 'outline'}>{r.estado}</Badge>;
            }
        },
        {
            header: 'Asignado A',
            accessorKey: 'empleado_nombre',
            cell: r => r.empleado_nombre ? (
                <div className="flex items-center gap-2 text-sm text-foreground">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {r.empleado_nombre}
                </div>
            ) : <span className="text-muted-foreground text-xs italic">-- En Almacén --</span>
        },
        {
            header: 'Etiqueta',
            accessorKey: 'etiqueta_interno',
            className: 'font-mono text-xs text-muted-foreground'
        },
    ];

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Inventario TI
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de activos tecnológicos y asignaciones.</p>
                </div>
                <ActionButtons
                    onCreate={() => router.push('/sistemas/inventario/nuevo')}
                    canCreate={true}
                />
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={activos}
                    columns={columns}
                    loading={loading}
                    onSearch={setSearch}
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
