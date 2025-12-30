'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    ShoppingCart, Search, DollarSign, CreditCard,
    Banknote, Plus, Minus, Trash2, X, Package
} from 'lucide-react';
import { PosProvider, usePosContext } from '@/context/PosContext';
import {
    getCatalogo, getAlmacenes, cobrarVenta,
    getEstadoCaja, abrirTurno
} from '@/services/pos';

function PosContent() {
    const {
        cart, addToCart, updateQuantity, removeFromCart, clearCart,
        subtotal, iva, total, itemCount,
        turnoActivo, setTurnoActivo,
        almacenSeleccionado, setAlmacenSeleccionado
    } = usePosContext();

    const [catalogo, setCatalogo] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Modales
    const [showApertura, setShowApertura] = useState(false);
    const [showCobro, setShowCobro] = useState(false);
    const [saldoInicial, setSaldoInicial] = useState('500');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [montoPagado, setMontoPagado] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (almacenSeleccionado) {
            fetchCatalogo();
        }
    }, [almacenSeleccionado]);

    const init = async () => {
        try {
            // Cargar almacenes
            const almacenesRes = await getAlmacenes();
            const almacenesData = almacenesRes.data.results || almacenesRes.data;
            setAlmacenes(almacenesData);

            if (almacenesData.length > 0) {
                setAlmacenSeleccionado(almacenesData[0].id);
            }

            // Verificar estado de caja (asumiendo caja ID 1 por ahora)
            const estadoRes = await getEstadoCaja(1);
            if (estadoRes.data.tiene_turno_abierto) {
                setTurnoActivo(estadoRes.data.turno);
            } else {
                setShowApertura(true);
            }
        } catch (error) {
            console.error('Error initializing POS:', error);
            toast.error('Error al inicializar el punto de venta');
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogo = async () => {
        try {
            const response = await getCatalogo(almacenSeleccionado);
            setCatalogo(response.data.results || []);
        } catch (error) {
            console.error('Error fetching catalog:', error);
            toast.error('Error al cargar el catálogo');
        }
    };

    const handleAbrirTurno = async () => {
        setProcessing(true);
        try {
            const response = await abrirTurno(1, parseFloat(saldoInicial));
            setTurnoActivo(response.data);
            setShowApertura(false);
            toast.success('Turno abierto exitosamente');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al abrir turno');
        } finally {
            setProcessing(false);
        }
    };

    const handleCobrar = async () => {
        if (cart.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }
        setShowCobro(true);
    };

    const handleConfirmarVenta = async () => {
        setProcessing(true);
        const toastId = toast.loading('Procesando venta...');

        try {
            const items = cart.map(item => ({
                tipo: item.tipo,
                [`${item.tipo}_id`]: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }));

            const payload = {
                items,
                metodo_pago: metodoPago,
                almacen_id: almacenSeleccionado
            };

            await cobrarVenta(payload);

            toast.success('¡Venta realizada exitosamente!', { id: toastId });
            clearCart();
            setShowCobro(false);
            setMontoPagado('');
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al procesar la venta';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const filteredCatalogo = catalogo.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cambio = montoPagado ? Math.max(0, parseFloat(montoPagado) - total) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShoppingCart size={32} />
                        <div>
                            <h1 className="text-2xl font-bold">Punto de Venta</h1>
                            {turnoActivo && (
                                <p className="text-sm text-blue-100">
                                    Turno: {turnoActivo.usuario_nombre} | Caja: {turnoActivo.caja_nombre}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={almacenSeleccionado || ''}
                            onChange={(e) => setAlmacenSeleccionado(parseInt(e.target.value))}
                            className="px-4 py-2 rounded-lg text-gray-900 font-medium"
                        >
                            {almacenes.map(alm => (
                                <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Catálogo - 2 columnas en desktop */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Buscador */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar productos..."
                                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Grid de Productos */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredCatalogo.map((item) => (
                                <button
                                    key={`${item.tipo}-${item.id}`}
                                    onClick={() => addToCart(item)}
                                    className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-left"
                                    style={{ borderLeft: `4px solid ${item.color_ui}` }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <Package size={24} style={{ color: item.color_ui }} />
                                        {item.tiene_inventario && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.stock_actual > 10 ? 'bg-green-100 text-green-700' :
                                                    item.stock_actual > 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                Stock: {item.stock_actual}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{item.nombre}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{item.codigo}</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        ${item.precio.toFixed(2)}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Carrito/Ticket - 1 columna */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl sticky top-4">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Ticket</h2>
                                    <span className="bg-white text-green-600 px-3 py-1 rounded-full font-bold">
                                        {itemCount} items
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 max-h-96 overflow-y-auto">
                                {cart.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>Carrito vacío</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{item.nombre}</p>
                                                    <p className="text-xs text-gray-500">${item.precio.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateQuantity(index, item.cantidad - 1)}
                                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold">{item.cantidad}</span>
                                                    <button
                                                        onClick={() => updateQuantity(index, item.cantidad + 1)}
                                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <>
                                    <div className="border-t border-gray-200 p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">IVA (16%):</span>
                                            <span className="font-medium">${iva.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-2xl font-bold border-t pt-2">
                                            <span>Total:</span>
                                            <span className="text-green-600">${total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0">
                                        <button
                                            onClick={handleCobrar}
                                            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                        >
                                            <DollarSign className="inline mr-2" size={24} />
                                            COBRAR
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Apertura de Turno */}
            {showApertura && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Apertura de Caja</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Saldo Inicial
                            </label>
                            <input
                                type="number"
                                value={saldoInicial}
                                onChange={(e) => setSaldoInicial(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                placeholder="0.00"
                                disabled={processing}
                            />
                        </div>
                        <button
                            onClick={handleAbrirTurno}
                            disabled={processing}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Abriendo...' : 'Abrir Turno'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Cobro */}
            {showCobro && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Cobrar Venta</h2>
                            <button
                                onClick={() => setShowCobro(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-3xl font-bold text-center text-green-600 mb-4">
                                ${total.toFixed(2)}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Método de Pago
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMetodoPago('EFECTIVO')}
                                    className={`p-4 rounded-lg border-2 font-medium transition-all ${metodoPago === 'EFECTIVO'
                                            ? 'border-green-600 bg-green-50 text-green-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <Banknote className="mx-auto mb-1" size={24} />
                                    Efectivo
                                </button>
                                <button
                                    onClick={() => setMetodoPago('TARJETA')}
                                    className={`p-4 rounded-lg border-2 font-medium transition-all ${metodoPago === 'TARJETA'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <CreditCard className="mx-auto mb-1" size={24} />
                                    Tarjeta
                                </button>
                            </div>
                        </div>

                        {metodoPago === 'EFECTIVO' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pago con:
                                </label>
                                <input
                                    type="number"
                                    value={montoPagado}
                                    onChange={(e) => setMontoPagado(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                                    placeholder="0.00"
                                />
                                {montoPagado && (
                                    <p className="mt-2 text-lg font-semibold">
                                        Cambio: <span className="text-green-600">${cambio.toFixed(2)}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleConfirmarVenta}
                            disabled={processing || (metodoPago === 'EFECTIVO' && parseFloat(montoPagado) < total)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-lg rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                        >
                            {processing ? 'Procesando...' : 'Confirmar Venta'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PosPage() {
    return (
        <PosProvider>
            <PosContent />
        </PosProvider>
    );
}
