'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, Filter, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

import { getOrdenesCompra } from '@/services/compras';

export default function ComprasPage() {
    const router = useRouter();
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchOrdenes = async () => {
        try {
            setLoading(true);
            const response = await getOrdenesCompra(); // TODO: add pagination/search params
            setOrdenes(response.data.results || response.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar órdenes de compra");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdenes();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'AUTORIZADA': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'PENDIENTE_AUTORIZACION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PENDIENTE_VOBO': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 'RECHAZADA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'BORRADOR': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 space-y-8 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Compras
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona tus órdenes de compra y aprobaciones.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => router.push('/compras/nueva')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Orden
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por folio o proveedor..."
                            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Placeholder for more filters */}
                    <Button variant="outline" className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                        <Filter className="w-4 h-4 mr-2" /> Filtros
                    </Button>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Folio</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Proveedor</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Fecha</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Total</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        Cargando órdenes...
                                    </TableCell>
                                </TableRow>
                            ) : ordenes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        No hay órdenes registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                ordenes.map((oc) => (
                                    <TableRow key={oc.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                        <TableCell className="font-medium text-gray-900 dark:text-white">
                                            {oc.folio}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-300">
                                            {oc.proveedor_nombre}
                                        </TableCell>
                                        <TableCell className="text-gray-500 dark:text-gray-400">
                                            {new Date(oc.fecha_solicitud).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium text-gray-900 dark:text-white">
                                            ${parseFloat(oc.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`border-0 ${getStatusColor(oc.estado)}`}>
                                                {oc.estado_display || oc.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/compras/${oc.id}`)}
                                                className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300"
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> Ver
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
