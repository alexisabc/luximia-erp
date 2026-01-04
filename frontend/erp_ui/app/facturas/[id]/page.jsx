'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    EnvelopeIcon,
    XCircleIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function FacturaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [factura, setFactura] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchFactura();
        }
    }, [params.id]);

    const fetchFactura = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/contabilidad/facturas/${params.id}/`);
            const data = await response.json();
            setFactura(data);
        } catch (error) {
            console.error('Error fetching factura:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarPDF = () => {
        window.open(`/api/contabilidad/facturas/${params.id}/pdf/`, '_blank');
    };

    const handleDescargarXML = () => {
        window.open(`/api/contabilidad/facturas/${params.id}/xml/`, '_blank');
    };

    const handleEnviarEmail = async () => {
        const email = prompt('Ingrese el email del destinatario:');
        if (!email) return;

        try {
            const response = await fetch(`/api/contabilidad/facturas/${params.id}/enviar_email/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                alert('Factura enviada por correo exitosamente');
            } else {
                alert('Error al enviar correo');
            }
        } catch (error) {
            alert('Error al enviar correo');
        }
    };

    const handleDuplicar = async () => {
        if (!confirm('¿Desea crear una copia de esta factura?')) return;

        try {
            // Crear nueva factura con los mismos datos
            const response = await fetch('/api/contabilidad/facturas/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cliente_id: factura.cliente?.id,
                    serie: factura.serie,
                    forma_pago: factura.forma_pago?.clave,
                    metodo_pago: factura.metodo_pago?.clave,
                    condiciones_pago: factura.condiciones_pago,
                    moneda: factura.moneda,
                    tipo_cambio: factura.tipo_cambio,
                    subtotal: factura.subtotal,
                    total: factura.total,
                    tipo_comprobante: factura.tipo_comprobante,
                    conceptos: factura.conceptos?.map(c => ({
                        clave_prod_serv: c.clave_prod_serv?.clave,
                        clave_unidad: c.clave_unidad?.clave,
                        descripcion: c.descripcion,
                        cantidad: c.cantidad,
                        valor_unitario: c.valor_unitario,
                        descuento: c.descuento,
                    }))
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Factura duplicada exitosamente');
                router.push(`/facturas/${data.id}`);
            } else {
                alert('Error al duplicar factura');
            }
        } catch (error) {
            alert('Error al duplicar factura');
        }
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'BORRADOR': { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, text: 'Borrador' },
            'TIMBRADA': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Timbrada' },
            'CANCELADA': { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Cancelada' },
            'ERROR': { color: 'bg-yellow-100 text-yellow-800', icon: XCircleIcon, text: 'Error' },
        };

        const badge = badges[estado] || badges['BORRADOR'];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                <Icon className="h-5 w-5" />
                {badge.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Cargando factura...</p>
                </div>
            </div>
        );
    }

    if (!factura) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <p className="mt-4 text-gray-500">Factura no encontrada</p>
                    <button
                        onClick={() => router.push('/facturas')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Volver a facturas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                        Volver
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Factura {factura.serie}-{factura.folio}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {new Date(factura.fecha).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div>
                            {getEstadoBadge(factura.estado)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                        {factura.estado === 'BORRADOR' && (
                            <>
                                <button
                                    onClick={() => router.push(`/facturas/${params.id}/editar`)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={handleDuplicar}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <DocumentDuplicateIcon className="h-5 w-5" />
                                    Duplicar
                                </button>
                            </>
                        )}

                        {factura.estado === 'TIMBRADA' && (
                            <>
                                <button
                                    onClick={handleDescargarPDF}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                    Descargar PDF
                                </button>
                                <button
                                    onClick={handleDescargarXML}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                    Descargar XML
                                </button>
                                <button
                                    onClick={handleEnviarEmail}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <EnvelopeIcon className="h-5 w-5" />
                                    Enviar por Correo
                                </button>
                                <button
                                    onClick={handleDuplicar}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <DocumentDuplicateIcon className="h-5 w-5" />
                                    Duplicar
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Datos Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Cliente */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h2>
                        <dl className="space-y-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                                <dd className="text-sm text-gray-900">{factura.cliente?.nombre_completo || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">RFC</dt>
                                <dd className="text-sm text-gray-900 font-mono">{factura.cliente?.rfc || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Datos de Pago */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Pago</h2>
                        <dl className="space-y-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Forma de Pago</dt>
                                <dd className="text-sm text-gray-900">{factura.forma_pago?.descripcion || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
                                <dd className="text-sm text-gray-900">{factura.metodo_pago?.descripcion || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Moneda</dt>
                                <dd className="text-sm text-gray-900">{factura.moneda}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* UUID (si está timbrada) */}
                {factura.uuid && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">UUID (Folio Fiscal)</h3>
                        <p className="text-sm font-mono text-blue-700 break-all">{factura.uuid}</p>
                        <p className="text-xs text-blue-600 mt-2">
                            Fecha de timbrado: {new Date(factura.fecha_timbrado).toLocaleString('es-MX')}
                        </p>
                    </div>
                )}

                {/* Conceptos */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Conceptos</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Unitario</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {factura.conceptos?.map((concepto, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{concepto.descripcion}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{concepto.cantidad}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                            ${parseFloat(concepto.valor_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                            ${parseFloat(concepto.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totales */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="max-w-sm ml-auto space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">${parseFloat(factura.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {factura.descuento > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Descuento:</span>
                                <span className="font-medium text-red-600">-${parseFloat(factura.descuento).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">IVA (16%):</span>
                            <span className="font-medium">${(parseFloat(factura.subtotal) * 0.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total:</span>
                            <span className="text-blue-600">${parseFloat(factura.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
