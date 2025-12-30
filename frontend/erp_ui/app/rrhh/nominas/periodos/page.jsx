'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Calendar, Search, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { getPeriodos, generarPeriodos } from '@/services/rrhh';
import DataTable from '@/components/organisms/DataTable';
import Modal from '@/components/modals';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";

export default function PeriodosNominaPage() {
    const router = useRouter();
    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filtros y Paginación
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({ anio: new Date().getFullYear(), tipo: 'all' });

    // Modal Generación
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generarAnio, setGenerarAnio] = useState(new Date().getFullYear());

    const loadPeriodos = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: pageSize,
                anio: filters.anio,
                tipo: filters.tipo !== 'all' ? filters.tipo : undefined,
                ordering: 'anio,tipo,numero'
            };
            const response = await getPeriodos(params);
            if (response.data.results) {
                setPeriodos(response.data.results);
                setTotalItems(response.data.count);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar periodos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPeriodos();
    }, [page, filters]);

    const handleGenerar = async () => {
        if (!generarAnio) return toast.error("Ingresa un año válido");

        setIsGenerating(true);
        try {
            await generarPeriodos(generarAnio);
            toast.success(`Periodos generados correctamente para el año ${generarAnio}`);
            setIsModalOpen(false);
            loadPeriodos();
        } catch (error) {
            console.error(error);
            toast.error("Error generando periodos");
        } finally {
            setIsGenerating(false);
        }
    };

    const columns = [
        { header: 'Año', accessorKey: 'anio', className: 'font-medium' },
        {
            header: 'Tipo',
            accessorKey: 'tipo',
            cell: (row) => (
                <Badge variant={row.tipo === 'SEMANAL' ? 'secondary' : 'default'}>
                    {row.tipo}
                </Badge>
            )
        },
        { header: 'No.', accessorKey: 'numero' },
        { header: 'Fecha Inicio', accessorKey: 'fecha_inicio' },
        { header: 'Fecha Fin', accessorKey: 'fecha_fin' },
        {
            header: 'Estado',
            accessorKey: 'activo',
            cell: (row) => (
                <Badge variant={row.activo ? 'success' : 'outline'} className={row.activo ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}>
                    {row.activo ? "Activo" : "Inactivo"}
                </Badge>
            )
        },
    ];

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Periodos de Nómina
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Administración de periodos Semanales y Quincenales
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/rrhh/nominas')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Nóminas
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generar Periodos
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6 flex gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Año
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="number"
                                value={filters.anio}
                                onChange={(e) => setFilters(prev => ({ ...prev, anio: e.target.value }))}
                                className="pl-9 w-32"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Tipo
                        </label>
                        <Select
                            value={filters.tipo}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="SEMANAL">Semanal</SelectItem>
                                <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <DataTable
                data={periodos}
                columns={columns}
                loading={loading}
                search={false}
                pagination={{
                    currentPage: page,
                    totalCount: totalItems,
                    pageSize: pageSize,
                    onPageChange: setPage
                }}
            />

            {/* Modal Generar */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generar Periodos Masivos">
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                        Esta acción generará automáticamente los periodos <strong>Semanales</strong> y <strong>Quincenales</strong> para el año seleccionado.
                        <br />
                        <span className="text-xs opacity-80 mt-1 block">Nota: Si los periodos ya existen, no se duplicarán.</span>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año a Generar</label>
                        <Input
                            type="number"
                            value={generarAnio}
                            onChange={(e) => setGenerarAnio(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleGenerar}
                            disabled={isGenerating}
                        >
                            {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            {isGenerating ? 'Generando...' : 'Generar'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
