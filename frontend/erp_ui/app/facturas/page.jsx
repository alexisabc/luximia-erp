'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    XCircleIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function FacturasPage() {
    const router = useRouter();
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('TODAS');

    useEffect(() => {
        fetchFacturas();
    }, [estadoFilter]);

    const fetchFacturas = async () => {
        try {
            setLoading(true);
            let url = '/api/contabilidad/facturas/';

            if (estadoFilter !== 'TODAS') {
                url += `?estado=${estadoFilter}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            setFacturas(data.results || data);
        } catch (error) {
            console.error('Error fetching facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimbrar = async (facturaId) => {
        if (!confirm('¿Desea timbrar esta factura? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/contabilidad/facturas/${facturaId}/timbrar/`, {
                method: 'POST',
            });

            if (response.ok) {
                alert('Factura timbrada exitosamente');
                fetchFacturas();
            } else {
                const error = await response.json();
                alert(`Error al timbrar: ${error.detail || 'Error desconocido'}`);
            }
        } catch (error) {
            alert('Error al timbrar la factura');
        }
    };

    const handleDescargarXML = (facturaId, uuid) => {
        window.open(`/api/contabilidad/facturas/${facturaId}/xml/`, '_blank');
    };

    const handleDescargarPDF = (facturaId) => {
        window.open(`/api/contabilidad/facturas/${facturaId}/pdf/`, '_blank');
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
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-4 w-4" />
                {badge.text}
            </span>
        );
    };

    const filteredFacturas = facturas.filter(factura => {
        const searchLower = searchTerm.toLowerCase();
        return (
            factura.folio?.toLowerCase().includes(searchLower) ||
            factura.cliente?.nombre_completo?.toLowerCase().includes(searchLower) ||
            factura.uuid?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Facturas Electrónicas</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gestión de CFDI 4.0 - Facturación electrónica
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/facturas/nueva')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Nueva Factura
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por folio, cliente o UUID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Estado Filter */}
                        <div>
                            <select
                                value={estadoFilter}
                                onChange={(e) => setEstadoFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="TODAS">Todos los estados</option>
                                <option value="BORRADOR">Borrador</option>
                                <option value="TIMBRADA">Timbrada</option>
                                <option value="CANCELADA">Cancelada</option>
                                <option value="ERROR">Error</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total', count: facturas.length, color: 'blue' },
                        { label: 'Timbradas', count: facturas.filter(f => f.estado === 'TIMBRADA').length, color: 'green' },
                        { label: 'Borradores', count: facturas.filter(f => f.estado === 'BORRADOR').length, color: 'gray' },
                        { label: 'Canceladas', count: facturas.filter(f => f.estado === 'CANCELADA').length, color: 'red' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-lg shadow-sm p-4">
                            <p className="text-sm text-gray-500">{stat.label}</p>
                            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.count}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                            <p className="mt-2 text-gray-500">Cargando facturas...</p>
                        </div>
                    ) : filteredFacturas.length === 0 ? (
                        <div className="p-12 text-center">
                            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-gray-500">No se encontraron facturas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Folio
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            UUID
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredFacturas.map((factura) => (
                                        <tr key={factura.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {factura.serie}-{factura.folio}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {factura.cliente?.nombre_completo || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(factura.fecha).toLocaleDateString('es-MX')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                ${parseFloat(factura.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getEstadoBadge(factura.estado)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {factura.uuid ? factura.uuid.substring(0, 8) + '...' : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {factura.estado === 'BORRADOR' && (
                                                        <button
                                                            onClick={() => handleTimbrar(factura.id)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Timbrar"
                                                        >
                                                            Timbrar
                                                        </button>
                                                    )}
                                                    {factura.estado === 'TIMBRADA' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDescargarXML(factura.id, factura.uuid)}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Descargar XML"
                                                            >
                                                                <ArrowDownTrayIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDescargarPDF(factura.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Descargar PDF"
                                                            >
                                                                PDF
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/facturas/${factura.id}`)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Ver
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
