'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
    FileText, Plus, Loader2, CheckCircle, XCircle,
    Clock, AlertCircle, Upload, FileCheck
} from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    getContraRecibos,
    createContraRecibo,
    validarContraRecibo
} from '@/services/treasury';
import apiClient from '@/services/api';

export default function ContraRecibosPage() {
    const [contraRecibos, setContraRecibos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [proveedores, setProveedores] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('');

    const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm();

    const tipoSeleccionado = watch('tipo', 'FACTURA');

    useEffect(() => {
        loadData();
        loadCatalogos();
    }, [filtroEstado]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = filtroEstado ? { estado: filtroEstado } : {};
            const res = await getContraRecibos(params);
            setContraRecibos(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando contrarecibos");
        } finally {
            setLoading(false);
        }
    };

    const loadCatalogos = async () => {
        try {
            const [proveedoresRes, monedasRes] = await Promise.all([
                apiClient.get('/compras/proveedores/'),
                apiClient.get('/contabilidad/monedas/')
            ]);
            setProveedores(proveedoresRes.data.results || proveedoresRes.data);
            setMonedas(monedasRes.data.results || monedasRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data) => {
        try {
            // Convertir archivos si existen
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    if (key === 'xml_archivo' || key === 'pdf_archivo') {
                        if (data[key][0]) {
                            formData.append(key, data[key][0]);
                        }
                    } else {
                        formData.append(key, data[key]);
                    }
                }
            });

            await createContraRecibo(formData);
            toast.success("ContraRecibo creado correctamente");
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error creando el contrarecibo");
        }
    };

    const handleValidar = async (cr) => {
        try {
            await validarContraRecibo(cr.id);
            toast.success("ContraRecibo validado y listo para pago");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error validando el contrarecibo");
        }
    };

    const stats = {
        total: contraRecibos.length,
        borradores: contraRecibos.filter(c => c.estado === 'BORRADOR').length,
        validados: contraRecibos.filter(c => c.estado === 'VALIDADO').length,
        pagados: contraRecibos.filter(c => c.estado === 'PAGADO').length,
        pendientes: contraRecibos.filter(c => parseFloat(c.saldo_pendiente || 0) > 0).length
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'BORRADOR': { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', icon: FileText },
            'VALIDADO': { color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', icon: CheckCircle },
            'PROGRAMADO': { color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', icon: Clock },
            'PAGADO_PARCIAL': { color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200', icon: AlertCircle },
            'PAGADO': { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', icon: CheckCircle },
            'CANCELADO': { color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200', icon: XCircle }
        };

        const badge = badges[estado] || badges['BORRADOR'];
        const Icon = badge.icon;

        return (
            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {estado.replace('_', ' ')}
            </span>
        );
    };

    const getTipoBadge = (tipo) => {
        const badges = {
            'FACTURA': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
            'ANTICIPO': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
            'GASTO_VIAJE': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
            'REEMBOLSO': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        };

        return (
            <span className={`px-2 py-1 text-xs rounded ${badges[tipo] || badges['FACTURA']}`}>
                {tipo.replace('_', ' ')}
            </span>
        );
    };

    const columns = [
        {
            header: 'Folio',
            accessorKey: 'folio',
            cell: (row) => <span className="font-mono font-bold text-blue-600">{row.folio}</span>
        },
        {
            header: 'Proveedor',
            accessorKey: 'proveedor_data',
            cell: (row) => (
                <div>
                    <div className="font-semibold">{row.proveedor_data?.razon_social || 'N/A'}</div>
                    {row.uuid && <div className="text-xs text-gray-500 font-mono truncate max-w-xs">{row.uuid}</div>}
                </div>
            )
        },
        {
            header: 'Tipo',
            accessorKey: 'tipo',
            cell: (row) => getTipoBadge(row.tipo)
        },
        {
            header: 'Fecha',
            accessorKey: 'fecha_recepcion',
            cell: (row) => (
                <div className="text-sm">
                    <div>Recep: {new Date(row.fecha_recepcion).toLocaleDateString('es-MX')}</div>
                    {row.fecha_vencimiento && (
                        <div className="text-xs text-gray-500">Venc: {new Date(row.fecha_vencimiento).toLocaleDateString('es-MX')}</div>
                    )}
                </div>
            )
        },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: (row) => (
                <div className="text-right">
                    <div className="font-bold text-lg">
                        ${parseFloat(row.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">{row.moneda_data?.codigo || 'MXN'}</div>
                </div>
            )
        },
        {
            header: 'Saldo Pendiente',
            accessorKey: 'saldo_pendiente',
            cell: (row) => {
                const saldo = parseFloat(row.saldo_pendiente || 0);
                const isPagado = saldo === 0;

                return (
                    <div className={`text-right font-bold ${isPagado ? 'text-green-600' : 'text-orange-600'}`}>
                        ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                );
            }
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => getEstadoBadge(row.estado)
        }
    ];

    const getCustomActions = (row) => {
        const actions = [];

        if (row.estado === 'BORRADOR') {
            actions.push({
                label: 'Validar',
                icon: CheckCircle,
                onClick: () => handleValidar(row),
                className: 'text-blue-600 hover:text-blue-700'
            });
        }

        if (row.xml_archivo) {
            actions.push({
                label: 'Ver XML',
                icon: FileCheck,
                onClick: () => window.open(row.xml_archivo, '_blank'),
                className: 'text-purple-600 hover:text-purple-700'
            });
        }

        return actions;
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 flex items-center gap-3">
                        <FileText className="text-indigo-600 w-8 h-8" />
                        ContraRecibos
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestión de facturas y documentos para pago
                    </p>
                </div>

                <ActionButtons
                    canCreate={true}
                    onCreate={() => { reset(); setIsModalOpen(true); }}
                    canImport={false}
                    canExport={false}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm">Total</p>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </div>
                        <FileText className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-100 text-sm">Borradores</p>
                            <p className="text-3xl font-bold">{stats.borradores}</p>
                        </div>
                        <FileText className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Validados</p>
                            <p className="text-3xl font-bold">{stats.validados}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Pagados</p>
                            <p className="text-3xl font-bold">{stats.pagados}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Pendientes</p>
                            <p className="text-3xl font-bold">{stats.pendientes}</p>
                        </div>
                        <AlertCircle className="w-12 h-12 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                <Button
                    variant={filtroEstado === '' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('')}
                    size="sm"
                >
                    Todos
                </Button>
                <Button
                    variant={filtroEstado === 'BORRADOR' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('BORRADOR')}
                    size="sm"
                >
                    Borradores
                </Button>
                <Button
                    variant={filtroEstado === 'VALIDADO' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('VALIDADO')}
                    size="sm"
                >
                    Validados
                </Button>
                <Button
                    variant={filtroEstado === 'PAGADO' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('PAGADO')}
                    size="sm"
                >
                    Pagados
                </Button>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={contraRecibos}
                    columns={columns}
                    loading={loading}
                    actions={{
                        customActions: getCustomActions
                    }}
                    emptyMessage="No hay contrarecibos registrados."
                />
            </div>

            {/* Modal Crear ContraRecibo */}
            <ReusableModal
                title="Nuevo ContraRecibo"
                description="Registra una factura o documento para pago"
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); reset(); }}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Proveedor *</Label>
                            <Controller
                                name="proveedor"
                                control={control}
                                rules={{ required: 'Selecciona un proveedor' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proveedores.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.razon_social}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.proveedor && <span className="text-red-500 text-xs">{errors.proveedor.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Controller
                                name="tipo"
                                control={control}
                                rules={{ required: 'Selecciona un tipo' }}
                                defaultValue="FACTURA"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FACTURA">Factura (CR Normal)</SelectItem>
                                            <SelectItem value="ANTICIPO">Anticipo (Sin Factura)</SelectItem>
                                            <SelectItem value="GASTO_VIAJE">Gasto de Viaje</SelectItem>
                                            <SelectItem value="REEMBOLSO">Reembolso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.tipo && <span className="text-red-500 text-xs">{errors.tipo.message}</span>}
                        </div>
                    </div>

                    {tipoSeleccionado === 'FACTURA' && (
                        <>
                            <div className="space-y-2">
                                <Label>UUID (Folio Fiscal)</Label>
                                <Input {...register('uuid')} placeholder="ABC12345-6789-0ABC-DEF1-234567890ABC" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Archivo XML</Label>
                                    <Input type="file" accept=".xml" {...register('xml_archivo')} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Archivo PDF</Label>
                                    <Input type="file" accept=".pdf" {...register('pdf_archivo')} />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha de Vencimiento</Label>
                            <Input type="date" {...register('fecha_vencimiento')} />
                        </div>

                        <div className="space-y-2">
                            <Label>Moneda *</Label>
                            <Controller
                                name="moneda"
                                control={control}
                                rules={{ required: 'Selecciona una moneda' }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monedas.map(m => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.codigo} - {m.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.moneda && <span className="text-red-500 text-xs">{errors.moneda.message}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Subtotal *</Label>
                            <Input type="number" step="0.01" {...register('subtotal', { required: 'Requerido', min: 0 })} placeholder="0.00" />
                            {errors.subtotal && <span className="text-red-500 text-xs">{errors.subtotal.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>IVA *</Label>
                            <Input type="number" step="0.01" {...register('iva', { required: 'Requerido', min: 0 })} placeholder="0.00" />
                            {errors.iva && <span className="text-red-500 text-xs">{errors.iva.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label>Total *</Label>
                            <Input type="number" step="0.01" {...register('total', { required: 'Requerido', min: 0.01 })} placeholder="0.00" />
                            {errors.total && <span className="text-red-500 text-xs">{errors.total.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comentarios</Label>
                        <Textarea {...register('comentarios')} placeholder="Notas adicionales" rows={2} />
                    </div>

                    <div className="flex justify-end pt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear ContraRecibo
                        </Button>
                    </div>
                </form>
            </ReusableModal>
        </div>
    );
}
