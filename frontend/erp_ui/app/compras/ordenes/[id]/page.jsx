'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getOrdenCompra, recibirOrden, getAlmacenes } from '@/services/compras';

export default function OrdenCompraDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [orden, setOrden] = useState(null);
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRecepcionModal, setShowRecepcionModal] = useState(false);
    const [selectedAlmacen, setSelectedAlmacen] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
        fetchAlmacenes();
    }, [params.id]);

    const fetchData = async () => {
        try {
            const response = await getOrdenCompra(params.id);
            setOrden(response.data);
        } catch (error) {
            toast.error('Error al cargar la orden de compra');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlmacenes = async () => {
        try {
            const response = await getAlmacenes();
            setAlmacenes(response.data.results || response.data);
        } catch (error) {
            console.error('Error al cargar almacenes:', error);
        }
    };

    const handleRecibir = async () => {
        if (!selectedAlmacen) {
            toast.error('Debe seleccionar un almacén de destino');
            return;
        }

        setProcessing(true);
        const toastId = toast.loading('Procesando recepción de mercancía...');

        try {
            await recibirOrden(params.id, selectedAlmacen);
            toast.success('Mercancía recibida exitosamente. Inventario actualizado.', { id: toastId });
            setShowRecepcionModal(false);
            fetchData(); // Recargar para mostrar estado COMPLETADA
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al procesar la recepción';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'BORRADOR': { color: 'bg-gray-100 text-gray-800', icon: Clock },
            'PENDIENTE_VOBO': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
            'PENDIENTE_AUTORIZACION': { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
            'AUTORIZADA': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'COMPLETADA': { color: 'bg-blue-100 text-blue-800', icon: Package },
            'RECHAZADA': { color: 'bg-red-100 text-red-800', icon: XCircle },
            'CANCELADA': { color: 'bg-gray-100 text-gray-600', icon: XCircle },
        };

        const badge = badges[estado] || badges['BORRADOR'];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                <Icon size={16} />
                {orden?.estado_display || estado}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!orden) {
        return (
            <div className="p-6">
                <p className="text-red-600">Orden no encontrada</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Volver</span>
                    </button>
                    {getEstadoBadge(orden.estado)}
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">{orden.folio}</h1>
                        <p className="text-blue-100">Orden de Compra</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Proveedor</label>
                                <p className="text-lg font-semibold text-gray-900">{orden.proveedor_nombre}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Solicitante</label>
                                <p className="text-lg text-gray-900">{orden.solicitante_nombre}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Fecha Solicitud</label>
                                <p className="text-lg text-gray-900">{new Date(orden.fecha_solicitud).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total</label>
                                <p className="text-2xl font-bold text-blue-600">
                                    ${parseFloat(orden.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Detalles Table */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Conceptos</h2>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Insumo
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cantidad
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Precio Unit.
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Importe
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orden.detalles?.map((detalle) => (
                                            <tr key={detalle.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {detalle.insumo_nombre}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {parseFloat(detalle.cantidad).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    ${parseFloat(detalle.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                    ${parseFloat(detalle.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Button */}
                        {orden.estado === 'AUTORIZADA' && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowRecepcionModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <Package size={20} />
                                    Recibir Mercancía
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Recepción */}
            {showRecepcionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recibir Mercancía</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccione Almacén de Destino
                            </label>
                            <select
                                value={selectedAlmacen}
                                onChange={(e) => setSelectedAlmacen(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={processing}
                            >
                                <option value="">-- Seleccione --</option>
                                {almacenes.map((almacen) => (
                                    <option key={almacen.id} value={almacen.id}>
                                        {almacen.nombre} ({almacen.codigo})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRecepcionModal(false)}
                                disabled={processing}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRecibir}
                                disabled={processing || !selectedAlmacen}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                            >
                                {processing ? 'Procesando...' : 'Confirmar Entrada'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
