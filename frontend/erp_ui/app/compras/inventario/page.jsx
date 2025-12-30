'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    Search, Filter, Download, TrendingUp, TrendingDown,
    Package, Calendar, FileText, ArrowUpCircle, ArrowDownCircle,
    RefreshCw, AlertTriangle
} from 'lucide-react';
import { getKardex, getInsumos, getAlmacenes } from '@/services/compras';

export default function KardexPage() {
    const [movimientos, setMovimientos] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        insumo: '',
        almacen: '',
        tipo_movimiento: '',
        fecha_desde: '',
        fecha_hasta: '',
        search: ''
    });

    useEffect(() => {
        fetchCatalogos();
        fetchMovimientos();
    }, []);

    const fetchCatalogos = async () => {
        try {
            const [insumosRes, almacenesRes] = await Promise.all([
                getInsumos(),
                getAlmacenes()
            ]);
            setInsumos(insumosRes.data.results || insumosRes.data);
            setAlmacenes(almacenesRes.data.results || almacenesRes.data);
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
        }
    };

    const fetchMovimientos = async () => {
        setLoading(true);
        try {
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            const response = await getKardex(cleanFilters);
            setMovimientos(response.data.results || response.data);
        } catch (error) {
            toast.error('Error al cargar movimientos de inventario');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        fetchMovimientos();
    };

    const handleClearFilters = () => {
        setFilters({
            insumo: '',
            almacen: '',
            tipo_movimiento: '',
            fecha_desde: '',
            fecha_hasta: '',
            search: ''
        });
        setTimeout(() => fetchMovimientos(), 100);
    };

    const getTipoMovimientoStyle = (tipo) => {
        const styles = {
            'ENTRADA': {
                bg: 'bg-green-50',
                text: 'text-green-700',
                border: 'border-green-200',
                icon: ArrowUpCircle,
                iconColor: 'text-green-600'
            },
            'SALIDA': {
                bg: 'bg-red-50',
                text: 'text-red-700',
                border: 'border-red-200',
                icon: ArrowDownCircle,
                iconColor: 'text-red-600'
            },
            'AJUSTE': {
                bg: 'bg-yellow-50',
                text: 'text-yellow-700',
                border: 'border-yellow-200',
                icon: RefreshCw,
                iconColor: 'text-yellow-600'
            },
            'TRASPASO': {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-200',
                icon: Package,
                iconColor: 'text-blue-600'
            }
        };
        return styles[tipo] || styles['AJUSTE'];
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
                            <FileText className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Kárdex de Inventarios</h1>
                            <p className="text-gray-600">Auditoría y trazabilidad de movimientos</p>
                        </div>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Búsqueda por texto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar por Referencia
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Ej: OC-2024-0001"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Filtro por Insumo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Producto/Insumo
                            </label>
                            <select
                                value={filters.insumo}
                                onChange={(e) => handleFilterChange('insumo', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                                <option value="">Todos los productos</option>
                                {insumos.map((insumo) => (
                                    <option key={insumo.id} value={insumo.id}>
                                        {insumo.codigo} - {insumo.descripcion}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Almacén */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Almacén
                            </label>
                            <select
                                value={filters.almacen}
                                onChange={(e) => handleFilterChange('almacen', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                                <option value="">Todos los almacenes</option>
                                {almacenes.map((almacen) => (
                                    <option key={almacen.id} value={almacen.id}>
                                        {almacen.nombre} ({almacen.codigo})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por Tipo de Movimiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Movimiento
                            </label>
                            <select
                                value={filters.tipo_movimiento}
                                onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="ENTRADA">Entradas</option>
                                <option value="SALIDA">Salidas</option>
                                <option value="AJUSTE">Ajustes</option>
                                <option value="TRASPASO">Traspasos</option>
                            </select>
                        </div>

                        {/* Fecha Desde */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Desde
                            </label>
                            <input
                                type="date"
                                value={filters.fecha_desde}
                                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Fecha Hasta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Hasta
                            </label>
                            <input
                                type="date"
                                value={filters.fecha_hasta}
                                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>

                {/* Results Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package size={20} className="text-purple-600" />
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Movimientos Registrados
                                </h2>
                                <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                                    {movimientos.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : movimientos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                            <AlertTriangle size={48} className="mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No se encontraron movimientos</p>
                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Insumo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Almacén
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Costo Unit.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Referencia
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {movimientos.map((mov) => {
                                        const tipoStyle = getTipoMovimientoStyle(mov.tipo_movimiento);
                                        const Icon = tipoStyle.icon;

                                        return (
                                            <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-gray-400" />
                                                        {formatDate(mov.fecha)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${tipoStyle.bg} ${tipoStyle.text} ${tipoStyle.border}`}>
                                                        <Icon size={14} className={tipoStyle.iconColor} />
                                                        {mov.tipo_movimiento_display || mov.tipo_movimiento}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="font-medium">{mov.insumo_nombre}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {mov.almacen_nombre}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    <span className={`font-semibold ${parseFloat(mov.cantidad) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {parseFloat(mov.cantidad) >= 0 ? '+' : ''}{parseFloat(mov.cantidad).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                    {formatCurrency(mov.costo_unitario)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <div className="max-w-xs truncate" title={mov.referencia}>
                                                        {mov.referencia || '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
