'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    Wallet, TrendingUp, TrendingDown, AlertCircle,
    Check, X, DollarSign, Building2, Calendar,
    ArrowUpCircle, ArrowDownCircle, CheckCircle2
} from 'lucide-react';
import {
    getCuentas, getMovimientos, getTurnosPendientes,
    procesarCorte, conciliarMovimiento, getDeudas, registrarPago
} from '@/services/tesoreria';

export default function TesoreriaPage() {
    const [cuentas, setCuentas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [turnosPendientes, setTurnosPendientes] = useState([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modales
    const [showDepositoModal, setShowDepositoModal] = useState(false);
    const [turnoADepositar, setTurnoADepositar] = useState(null);
    const [cuentaDestino, setCuentaDestino] = useState('');
    const [deudas, setDeudas] = useState({ cxc: { total: 0, items: [] }, cxp: { total: 0, items: [] } });
    const [activeTab, setActiveTab] = useState('cuentas'); // 'cuentas', 'cxc', 'cxp'
    const [processing, setProcessing] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (cuentaSeleccionada) {
            fetchMovimientos(cuentaSeleccionada);
        } else {
            fetchMovimientos();
        }
    }, [cuentaSeleccionada]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cuentasRes, turnosRes, deudasRes] = await Promise.all([
                getCuentas(),
                getTurnosPendientes(),
                getDeudas()
            ]);

            setCuentas(cuentasRes.data.results || cuentasRes.data);
            setTurnosPendientes(turnosRes.data.results || []);
            setDeudas(deudasRes.data);

            await fetchMovimientos();
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar datos de tesorería');
        } finally {
            setLoading(false);
        }
    };

    const fetchMovimientos = async (cuentaId = null) => {
        try {
            const filters = {};
            if (cuentaId) {
                filters.cuenta = cuentaId;
            }

            const response = await getMovimientos(filters);
            setMovimientos(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching movements:', error);
        }
    };

    const handleDepositarClick = (turno) => {
        setTurnoADepositar(turno);
        setShowDepositoModal(true);
    };

    const handleConfirmarDeposito = async () => {
        if (!cuentaDestino) {
            toast.error('Selecciona una cuenta de destino');
            return;
        }

        setProcessing(true);
        const toastId = toast.loading('Procesando depósito...');

        try {
            await procesarCorte(turnoADepositar.id, parseInt(cuentaDestino));
            toast.success('Depósito procesado exitosamente', { id: toastId });
            setShowDepositoModal(false);
            setCuentaDestino('');
            setTurnoADepositar(null);
            fetchData(); // Recargar todo
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al procesar depósito';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const handleConciliar = async (movimientoId) => {
        const toastId = toast.loading('Conciliando movimiento...');
        try {
            await conciliarMovimiento(movimientoId);
            toast.success('Movimiento conciliado', { id: toastId });
            fetchMovimientos(cuentaSeleccionada);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al conciliar';
            toast.error(errorMsg, { id: toastId });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    const maskAccountNumber = (number) => {
        if (!number) return '';
        const visible = number.slice(-4);
        return `****${visible}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tesorería Corporativa</h1>
                <p className="text-gray-600">Balance consolidado, gestión de deudas y fiscalización</p>
            </div>

            {/* Tabs de Navegación */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('cuentas')}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'cuentas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Resumen de Cuentas
                </button>
                <button
                    onClick={() => setActiveTab('cxc')}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'cxc' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Cuentas por Cobrar ({formatCurrency(deudas.cxc.total)})
                </button>
                <button
                    onClick={() => setActiveTab('cxp')}
                    className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'cxp' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Cuentas por Pagar ({formatCurrency(deudas.cxp.total)})
                </button>
            </div>

            {activeTab === 'cuentas' && (
                <>
                    {/* Sección 1: Tarjetas de Cuentas */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Wallet size={24} />
                            Cuentas Bancarias
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cuentas.map((cuenta) => (
                                <button
                                    key={cuenta.id}
                                    onClick={() => setCuentaSeleccionada(cuenta.id === cuentaSeleccionada ? null : cuenta.id)}
                                    className={`bg-white rounded-xl p-6 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-left ${cuentaSeleccionada === cuenta.id ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={20} className="text-blue-600" />
                                            <span className="font-semibold text-gray-900">{cuenta.banco_nombre}</span>
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            {cuenta.moneda}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-1">{maskAccountNumber(cuenta.numero_cuenta)}</p>
                                    <p className="text-xs text-gray-400 mb-4">{cuenta.tipo_cuenta}</p>
                                    <div className="border-t pt-4">
                                        <p className="text-xs text-gray-500 mb-1">Saldo Actual</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(cuenta.saldo_actual)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sección 2: Dinero en Tránsito */}
                    {turnosPendientes.length > 0 && (
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-lg p-6 shadow-md">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertCircle size={24} className="text-orange-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Dinero en Tránsito - Turnos Pendientes de Depositar
                                    </h2>
                                    <span className="ml-auto bg-orange-600 text-white px-3 py-1 rounded-full font-bold">
                                        {turnosPendientes.length}
                                    </span>
                                </div>

                                <div className="bg-white rounded-lg overflow-hidden shadow">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caja</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cajero</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Cierre</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {turnosPendientes.map((turno) => (
                                                <tr key={turno.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                        {turno.caja}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                        {turno.usuario}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                        {new Date(turno.fecha_cierre).toLocaleDateString('es-MX')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-lg font-bold text-green-600">
                                                            {formatCurrency(turno.saldo_final_calculado)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`font-medium ${turno.diferencia === 0 ? 'text-green-600' :
                                                            Math.abs(turno.diferencia) < 10 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                            }`}>
                                                            {formatCurrency(turno.diferencia)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleDepositarClick(turno)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                                                        >
                                                            <DollarSign size={18} />
                                                            Depositar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sección 3: Bitácora de Movimientos */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar size={24} />
                                Movimientos Bancarios
                                {cuentaSeleccionada && (
                                    <span className="text-sm font-normal text-gray-500">
                                        (Filtrando por cuenta seleccionada)
                                    </span>
                                )}
                            </h2>
                            {cuentaSeleccionada && (
                                <button
                                    onClick={() => setCuentaSeleccionada(null)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Ver todos
                                </button>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {movimientos.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                No hay movimientos registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        movimientos.map((mov) => (
                                            <tr key={mov.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(mov.fecha).toLocaleDateString('es-MX')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                                                    <p className="font-medium">{mov.concepto}</p>
                                                    {mov.origen_detalle && (
                                                        <p className="text-xs text-gray-400 mt-1">{mov.origen_detalle}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {mov.tipo === 'INGRESO' ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium" >
                                                            <ArrowUpCircle size={16} />
                                                            Ingreso
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                            <ArrowDownCircle size={16} />
                                                            Egreso
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-lg font-bold ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.monto)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {mov.conciliado ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                            <CheckCircle2 size={16} />
                                                            Conciliado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                                            <AlertCircle size={16} />
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {!mov.conciliado && (
                                                        <button
                                                            onClick={() => handleConciliar(mov.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                            title="Conciliar"
                                                        >
                                                            <Check size={16} />
                                                            Conciliar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'cxc' && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold mb-6">Cartera de Clientes (CXC)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {deudas.cxc.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay cuentas por cobrar</td>
                                    </tr>
                                ) : (
                                    deudas.cxc.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.folio}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.cliente}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(item.fecha).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{formatCurrency(item.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => { setVentaSeleccionada(item); setShowPagoModal(true); }}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                >
                                                    Registrar Cobro
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'cxp' && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold mb-6">Cuentas por Pagar (CXP)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor / Beneficiario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {deudas.cxp.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No hay cuentas por pagar</td>
                                    </tr>
                                ) : (
                                    deudas.cxp.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.folio}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.proveedor || 'Nómina'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(item.fecha).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modales Compartidos */}
            {showDepositoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Depositar Corte de Caja</h2>
                            <button
                                onClick={() => setShowDepositoModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {turnoADepositar && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Turno:</span> {turnoADepositar.caja} - {turnoADepositar.usuario}
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(turnoADepositar.saldo_final_calculado)}
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuenta de Destino
                            </label>
                            <select
                                value={cuentaDestino}
                                onChange={(e) => setCuentaDestino(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={processing}
                            >
                                <option value="">Selecciona una cuenta...</option>
                                {cuentas.map((cuenta) => (
                                    <option key={cuenta.id} value={cuenta.id}>
                                        {cuenta.banco_nombre} - {maskAccountNumber(cuenta.numero_cuenta)} ({cuenta.moneda})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDepositoModal(false)}
                                disabled={processing}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarDeposito}
                                disabled={processing || !cuentaDestino}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                            >
                                {processing ? 'Procesando...' : 'Confirmar Depósito'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPagoModal && ventaSeleccionada && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Registrar Cobro: {ventaSeleccionada.folio}</h3>
                            <button onClick={() => setShowPagoModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                            <p className="text-sm text-blue-700 font-medium">Cliente: {ventaSeleccionada.cliente}</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">Saldo: {formatCurrency(ventaSeleccionada.total)}</p>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto del Pago</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input
                                        type="number"
                                        defaultValue={ventaSeleccionada.total}
                                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl font-bold"
                                        id="pago_monto"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cuenta de Destino</label>
                                <select className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500" id="pago_cuenta">
                                    {cuentas.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.banco_nombre} - {maskAccountNumber(c.numero_cuenta)} ({c.moneda})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
                                <AlertCircle size={16} />
                                <span>Al procesar el pago se generará automáticamente el Complemento de Pago (REP) ante el SAT.</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowPagoModal(false)}
                                disabled={processing}
                                className="flex-1 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    const monto = document.getElementById('pago_monto').value;
                                    const cuentaId = document.getElementById('pago_cuenta').value;

                                    if (!monto || parseFloat(monto) <= 0) {
                                        toast.error("Ingresa un monto válido");
                                        return;
                                    }

                                    setProcessing(true);
                                    const tId = toast.loading("Procesando pago y timbrando REP...");
                                    try {
                                        await registrarPago({
                                            venta_id: ventaSeleccionada.id,
                                            monto: parseFloat(monto),
                                            cuenta_bancaria_id: parseInt(cuentaId)
                                        });
                                        toast.success("Pago registrado y REP timbrado exitosamente", { id: tId });
                                        setShowPagoModal(false);
                                        fetchData();
                                    } catch (e) {
                                        const msg = e.response?.data?.error || e.message || "Error al registrar el pago";
                                        toast.error(msg, { id: tId });
                                    }
                                    setProcessing(false);
                                }}
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {processing ? 'Procesando...' : 'Confirmar Cobro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
