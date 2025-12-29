'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, ShoppingCart, CreditCard, DollarSign,
    Trash2, Plus, Minus, RefreshCw, LogOut,
    AlertTriangle, Check
} from 'lucide-react';
import { toast } from 'sonner';

import {
    getProductosPOS, getTurnoActivo, abrirTurno, cerrarTurno,
    getCajas, createVenta, getCuentaCliente
} from '@/services/pos';
import { getClientes } from '@/services/accounting';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import ConnectivityIndicator from '@/components/ui/ConnectivityIndicator';

export default function POSTerminalPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [turno, setTurno] = useState(null);

    // Estado de Venta
    const [items, setItems] = useState([]);
    const [cliente, setCliente] = useState(null);
    const [cuentaCliente, setCuentaCliente] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Modales
    const [showTurnoModal, setShowTurnoModal] = useState(false);
    const [cajas, setCajas] = useState([]);
    const [montoInicial, setMontoInicial] = useState('');
    const [selectedCaja, setSelectedCaja] = useState('');

    const [showCorteModal, setShowCorteModal] = useState(false);
    const [montoCierre, setMontoCierre] = useState('');
    const [corteProcesando, setCorteProcesando] = useState(false);

    const [showCobrarModal, setShowCobrarModal] = useState(false);
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [metodoPago2, setMetodoPago2] = useState(null);
    const [montoPago1, setMontoPago1] = useState(0);
    const [montoPago2, setMontoPago2] = useState(0);
    const [usarDobleMetodo, setUsarDobleMetodo] = useState(false);
    const [pagoProcesando, setPagoProcesando] = useState(false);

    // Refs
    const searchInputRef = useRef(null);

    // Estado para feedback visual
    const [recentlyAdded, setRecentlyAdded] = useState(null);

    // 1. Inicialización: Buscar Turno Activo
    useEffect(() => {
        checkTurno();
    }, []);

    // Atajos de Teclado (Optimización de velocidad)
    useEffect(() => {
        const handleKeyPress = (e) => {
            // F2: Focus en búsqueda
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
                toast.info('F2: Búsqueda de productos');
            }

            // F3: Cobrar
            if (e.key === 'F3' && items.length > 0 && turno) {
                e.preventDefault();
                setShowCobrarModal(true);
                toast.info('F3: Procesar pago');
            }

            // F4: Limpiar carrito
            if (e.key === 'F4' && items.length > 0) {
                e.preventDefault();
                if (confirm('¿Limpiar carrito?')) {
                    setItems([]);
                    toast.success('Carrito limpiado');
                }
            }

            // F5: Buscar cliente
            if (e.key === 'F5') {
                e.preventDefault();
                toast.info('F5: Búsqueda de cliente');
                // Focus en búsqueda de cliente (implementar según tu UI)
            }

            // ESC: Cerrar modales
            if (e.key === 'Escape') {
                setShowCobrarModal(false);
                setShowCorteModal(false);
                setShowTurnoModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [items.length, turno]);

    const checkTurno = async () => {
        // Only set loading if not already loading (prevent flash)
        // setLoading(true); 
        try {
            const activeTurno = await getTurnoActivo();
            if (activeTurno) {
                setTurno(activeTurno);
                setShowTurnoModal(false); // Ensure modal is closed if turn exists
            } else {
                setTurno(null);
                const { data } = await getCajas();
                setCajas(data.results || []);
                setShowTurnoModal(true);
            }
        } catch (error) {
            console.error("Error verificando turno:", error);
            toast.error("Error de conexión con POS");
        } finally {
            setLoading(false);
        }
    };

    const handleAbrirTurno = async () => {
        if (!selectedCaja || !montoInicial) return toast.warning("Selecciona caja y monto inicial");

        setLoading(true); // Show global loading or just process
        try {
            await abrirTurno(selectedCaja, montoInicial);
            toast.success("Turno abierto exitosamente");
            // Re-fetch everything to ensure state is consistent and we have standard fields
            await checkTurno();
            setShowTurnoModal(false);
        } catch (error) {
            console.error("Error opening shift:", error);
            const msg = error.response?.data?.detail || error.message || "Error al abrir turno";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCorteCaja = async () => {
        if (!montoCierre) return toast.warning("Ingresa el monto en caja");

        setCorteProcesando(true);
        try {
            await cerrarTurno(turno.id, montoCierre);
            toast.success("Corte de caja realizado exitosamente");
            setShowCorteModal(false);
            setMontoCierre('');
            // Al cerrar, re-verificamos para que salga el modal de abrir turno
            await checkTurno();
        } catch (error) {
            console.error(error);
            toast.error("Error al realizar corte");
        } finally {
            setCorteProcesando(false);
        }
    };

    // 2. Buscador de Productos (Optimizado)
    useEffect(() => {
        const controller = new AbortController();
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                try {
                    const { data } = await getProductosPOS(searchTerm);
                    setSearchResults(data.results || []);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error(error);
                    }
                }
            } else {
                setSearchResults([]);
            }
        }, 300); // Reducido de 500ms a 300ms para mayor velocidad

        return () => {
            clearTimeout(delayDebounceFn);
            controller.abort();
        };
    }, [searchTerm]);

    const addToCart = (producto) => {
        // Validación de stock
        if (producto.stock_disponible !== undefined && producto.stock_disponible <= 0) {
            toast.error(`${producto.nombre} sin stock disponible`);
            return;
        }

        setItems(prev => {
            const existing = prev.find(i => i.id === producto.id);
            const newQty = existing ? existing.cantidad + 1 : 1;

            // Validar que no exceda el stock
            if (producto.stock_disponible !== undefined && newQty > producto.stock_disponible) {
                toast.warning(`Stock máximo: ${producto.stock_disponible} unidades`);
                return prev;
            }

            if (existing) {
                return prev.map(i => i.id === producto.id ? { ...i, cantidad: newQty } : i);
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });

        // Feedback visual
        setRecentlyAdded(producto.id);
        setTimeout(() => setRecentlyAdded(null), 1000);

        // Sonido de confirmación (opcional)
        try {
            new Audio('/sounds/beep.mp3').play().catch(() => { });
        } catch (e) { }

        setSearchTerm('');
        setSearchResults([]);
        searchInputRef.current?.focus();
    };

    const updateQuantity = (id, delta) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0.1, parseFloat(item.cantidad) + delta);
                return { ...item, cantidad: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // 3. Totales (Optimizado con useMemo)
    const total = useMemo(() =>
        items.reduce((acc, item) => acc + ((item.precio_final || item.precio_lista * 1.16) * item.cantidad), 0),
        [items]
    );

    const impuestos = useMemo(() => total - (total / 1.16), [total]);

    // 4. Cobro
    const handleCobrar = async () => {
        if (items.length === 0) return toast.warning("Carrito vacío");
        if (!turno) return toast.error("No hay turno activo");

        // Validar métodos de pago que requieren cliente
        if (metodoPago === 'CREDITO' || metodoPago === 'ANTICIPO') {
            if (!cliente) return toast.error("Cliente requerido para Crédito/Anticipo");
        }
        if (usarDobleMetodo && (metodoPago2 === 'CREDITO' || metodoPago2 === 'ANTICIPO')) {
            if (!cliente) return toast.error("Cliente requerido para Crédito/Anticipo");
        }

        // Validar montos en pago dividido
        if (usarDobleMetodo) {
            if (!metodoPago2) return toast.warning("Selecciona el segundo método de pago");
            if (parseFloat(montoPago1) + parseFloat(montoPago2) !== total) {
                return toast.error("La suma de los montos debe ser igual al total");
            }
        }

        setPagoProcesando(true);
        try {
            const payload = {
                turno: turno.id,
                cliente: cliente?.id,
                items: items.map(i => ({ producto_id: i.id, cantidad: i.cantidad })),
                metodo_pago_principal: metodoPago,
                monto_metodo_principal: usarDobleMetodo ? parseFloat(montoPago1) : total,
            };

            if (usarDobleMetodo && metodoPago2) {
                payload.metodo_pago_secundario = metodoPago2;
                payload.monto_metodo_secundario = parseFloat(montoPago2);
            }

            await createVenta(payload);
            toast.success("Venta registrada correctamente");
            setShowCobrarModal(false);
            setItems([]);
            setCliente(null);
            setCuentaCliente(null);
            setMetodoPago('EFECTIVO');
            setMetodoPago2(null);
            setUsarDobleMetodo(false);
            setMontoPago1(0);
            setMontoPago2(0);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al procesar venta");
        } finally {
            setPagoProcesando(false);
        }
    };

    // 5. Clientes
    const [clientesSearch, setClientesSearch] = useState('');
    const [clientesResults, setClientesResults] = useState([]);

    const searchClientes = async (q) => {
        try {
            const { data } = await getClientes(1, 10, { search: q });
            setClientesResults(data.results);
        } catch (e) { console.error(e); }
    };

    const selectCliente = async (c) => {
        setCliente(c);
        setClientesResults([]);
        setClientesSearch('');
        try {
            const { data } = await getCuentaCliente(c.id);
            if (data.results && data.results.length > 0) {
                setCuentaCliente(data.results[0]);
            } else {
                setCuentaCliente({ saldo: 0, credito_disponible: 0 });
            }
        } catch (e) { console.error(e); }
    };


    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><RefreshCw className="animate-spin w-10 h-10 text-gray-400" /></div>;

    return (
        // Wrapper principal debe ser relativo y llenar el espacio disponible del layout
        <div className="flex flex-col h-[calc(100vh-2rem)] -m-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 overflow-hidden relative">
            {/* Header POS */}
            <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-10 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">
                        LX
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Terminal Punto de Venta</h1>
                        <p className="text-xs text-gray-400">
                            Turno #{turno?.id || '---'} • {turno?.usuario_nombre || 'Sin Usuario'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            F2: Buscar | F3: Cobrar | F4: Limpiar | F5: Cliente | ESC: Cerrar
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ConnectivityIndicator />
                    <Badge className={`${turno ? "bg-green-600 hover:bg-green-700 border-none text-white" : "bg-red-600 hover:bg-red-700 border-none text-white"} text-sm px-3 py-1`}>
                        {turno ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
                    </Badge>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push('/pos/ventas')}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Historial
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowCorteModal(true)}
                        disabled={!turno}
                        className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Corte Z
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* IZQUIERDA: Productos y Carrito */}
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden min-w-0">
                    {/* Buscador */}
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        <Input
                            ref={searchInputRef}
                            className="pl-10 h-12 text-lg shadow-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Escanear código o buscar producto (F2)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {/* Resultados Flotantes */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-14 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl z-20 max-h-96 overflow-y-auto">
                                {searchResults.map(prod => (
                                    <div
                                        key={prod.id}
                                        onClick={() => addToCart(prod)}
                                        className="p-3 border-b dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{prod.nombre}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{prod.codigo} • {prod.unidad_medida}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-gray-100">${parseFloat(prod.precio_final).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tabla Carrito */}
                    <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-0">
                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full text-left relative">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold w-1/3">Producto</th>
                                        <th className="px-6 py-3 font-semibold text-center w-32">Cantidad</th>
                                        <th className="px-6 py-3 font-semibold text-right w-32">Precio</th>
                                        <th className="px-6 py-3 font-semibold text-right w-32">Subtotal</th>
                                        <th className="w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-10 text-center text-gray-400">
                                                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>El carrito está vacío</p>
                                                <p className="text-sm">Escanea un producto para comenzar</p>
                                            </td>
                                        </tr>
                                    ) : items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300 ${recentlyAdded === item.id ? 'bg-green-100 dark:bg-green-900/20 scale-[1.01]' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{item.nombre}</p>
                                                <p className="text-xs text-gray-500 font-mono">{item.codigo}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"><Minus className="w-3 h-3" /></button>
                                                    <span className="w-12 text-center font-mono font-medium dark:text-gray-200">{item.cantidad}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums text-gray-600 dark:text-gray-300">
                                                ${parseFloat(item.precio_final).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                                                ${(item.precio_final * item.cantidad).toFixed(2)}
                                            </td>
                                            <td className="px-4 text-center">
                                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* DERECHA: Totales y Cobro */}
                <div className="w-[400px] flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-20 h-full">
                    {/* Cliente */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Cliente</label>
                        {cliente ? (
                            <div className="bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900 rounded-lg p-3 shadow-sm relative">
                                <button onClick={() => { setCliente(null); setCuentaCliente(null); }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                <p className="font-bold text-gray-900 dark:text-gray-100 truncate pr-5 mb-2">{cliente.nombre_completo}</p>
                                {cuentaCliente && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Anticipo</span>
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                ${parseFloat(Math.max(0, cuentaCliente.saldo)).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Crédito Disp.</span>
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                ${parseFloat(cuentaCliente.credito_disponible).toFixed(2)}
                                            </span>
                                        </div>
                                        {cuentaCliente.saldo < 0 && (
                                            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <span className="text-xs font-medium text-red-700 dark:text-red-300">Deuda</span>
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                                    ${parseFloat(Math.abs(cuentaCliente.saldo)).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    className="pl-9 bg-white dark:bg-gray-800"
                                    placeholder="Buscar Cliente..."
                                    value={clientesSearch}
                                    onChange={(e) => { setClientesSearch(e.target.value); searchClientes(e.target.value); }}
                                />
                                {clientesResults.length > 0 && (
                                    <div className="absolute top-10 left-0 right-0 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded-lg z-30 max-h-48 overflow-y-auto">
                                        {clientesResults.map(c => (
                                            <div key={c.id} onClick={() => selectCliente(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm dark:text-gray-200">
                                                {c.nombre_completo}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resumen */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-0">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>${(total / 1.16).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Impuestos (16%)</span>
                            <span>${impuestos.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-4" />
                        <div className="flex justify-between items-end">
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-200">TOTAL</span>
                            <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-3 flex-shrink-0">
                        <Button
                            className="w-full h-14 text-xl font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => setShowCobrarModal(true)}
                            disabled={items.length === 0}
                        >
                            <Check className="mr-2 h-6 w-6" />
                            COBRAR (F12)
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="w-full">Abonar</Button>
                            <Button
                                variant="destructive"
                                className="w-full bg-red-100 text-red-600 hover:bg-red-200 border-none dark:bg-red-900/30 dark:text-red-400"
                                onClick={() => setItems([])}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Apertura Turno */}
            <Dialog open={showTurnoModal} onOpenChange={setShowTurnoModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apertura de Caja</DialogTitle>
                        <DialogDescription>Selecciona una caja e ingresa el saldo inicial.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Caja Destino</label>
                            <Select onValueChange={setSelectedCaja} value={selectedCaja}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Caja" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cajas.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fondo Inicial (Efectivo)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <Input
                                    className="pl-9"
                                    type="number"
                                    value={montoInicial}
                                    onChange={e => setMontoInicial(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAbrirTurno} disabled={!selectedCaja || !montoInicial}>Iniciar Turno</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Cobro */}
            <Dialog open={showCobrarModal} onOpenChange={(open) => { setShowCobrarModal(open); if (!open) { setUsarDobleMetodo(false); setMetodoPago2(null); } }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-indigo-600" />
                            Procesar Pago
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        {/* Total */}
                        <div className="text-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                            <p className="text-sm text-gray-500 uppercase mb-1">Total a Pagar</p>
                            <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">${total.toFixed(2)}</p>
                        </div>

                        {/* Client Status Warnings */}
                        {cliente && cuentaCliente && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Anticipo Disponible</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        ${parseFloat(Math.max(0, cuentaCliente.saldo)).toFixed(2)}
                                    </p>
                                    {cuentaCliente.saldo < total && cuentaCliente.saldo > 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Insuficiente para total</p>
                                    )}
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Cr\u00e9dito Disponible</p>
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        ${parseFloat(cuentaCliente.credito_disponible).toFixed(2)}
                                    </p>
                                    {cuentaCliente.credito_disponible < total && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Insuficiente para total</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Split Payment Toggle */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm font-medium">Usar 2 formas de pago</span>
                            <button
                                onClick={() => {
                                    setUsarDobleMetodo(!usarDobleMetodo);
                                    if (!usarDobleMetodo) {
                                        setMontoPago1(total);
                                        setMontoPago2(0);
                                    }
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${usarDobleMetodo ? 'bg-indigo-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${usarDobleMetodo ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Payment Method 1 */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {usarDobleMetodo ? 'M\u00e9todo de Pago 1' : 'M\u00e9todo de Pago'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'EFECTIVO', icon: DollarSign, label: 'Efectivo' },
                                    { id: 'TRANSFERENCIA', icon: RefreshCw, label: 'Transferencia' },
                                    { id: 'CREDITO', icon: AlertTriangle, label: 'Cr\u00e9dito' },
                                    { id: 'ANTICIPO', icon: Check, label: 'Anticipo' },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMetodoPago(m.id)}
                                        disabled={!cliente && (m.id === 'CREDITO' || m.id === 'ANTICIPO')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                            ${metodoPago === m.id
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-2'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                    >
                                        <m.icon className="w-6 h-6" />
                                        <span className="font-semibold text-sm">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                            {usarDobleMetodo && (
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-9 text-lg font-bold"
                                        placeholder="Monto"
                                        value={montoPago1}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setMontoPago1(val);
                                            setMontoPago2(Math.max(0, total - val));
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Payment Method 2 */}
                        {usarDobleMetodo && (
                            <div className="space-y-3 border-t pt-4">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">M\u00e9todo de Pago 2</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'EFECTIVO', icon: DollarSign, label: 'Efectivo' },
                                        { id: 'TRANSFERENCIA', icon: RefreshCw, label: 'Transferencia' },
                                        { id: 'CREDITO', icon: AlertTriangle, label: 'Cr\u00e9dito' },
                                        { id: 'ANTICIPO', icon: Check, label: 'Anticipo' },
                                    ].filter(m => m.id !== metodoPago).map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMetodoPago2(m.id)}
                                            disabled={!cliente && (m.id === 'CREDITO' || m.id === 'ANTICIPO')}
                                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                                ${metodoPago2 === m.id
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-2'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                        >
                                            <m.icon className="w-6 h-6" />
                                            <span className="font-semibold text-sm">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-9 text-lg font-bold"
                                        placeholder="Monto"
                                        value={montoPago2}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setMontoPago2(val);
                                            setMontoPago1(Math.max(0, total - val));
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Validation Messages */}
                        {usarDobleMetodo && montoPago1 + montoPago2 !== total && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                La suma debe ser ${total.toFixed(2)}. Actual: ${(montoPago1 + montoPago2).toFixed(2)}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCobrarModal(false)}>Cancelar</Button>
                        <Button
                            onClick={handleCobrar}
                            disabled={pagoProcesando}
                            className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto"
                        >
                            {pagoProcesando ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            {pagoProcesando ? 'Procesando...' : 'Confirmar Cobro'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Corte de Caja (Cerrar Turno) */}
            <Dialog open={showCorteModal} onOpenChange={setShowCorteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Corte de Caja (Z)
                        </DialogTitle>
                        <DialogDescription>
                            Estás a punto de cerrar tu turno. Ingresa el efectivo total contado en caja.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                            <strong>Atención:</strong> Esta acción cerrará tu sesión de venta y generará el reporte de cuadre.
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Monto Declarado (Efectivo)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <Input
                                    className="pl-9 text-lg font-bold"
                                    type="number"
                                    value={montoCierre}
                                    onChange={e => setMontoCierre(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCorteModal(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={handleCorteCaja}
                            disabled={corteProcesando || !montoCierre}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {corteProcesando ? "Procesando..." : "Confirmar Corte"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
