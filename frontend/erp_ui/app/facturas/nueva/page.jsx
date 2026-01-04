'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function NuevaFacturaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [usosCFDI, setUsosCFDI] = useState([]);

    const [factura, setFactura] = useState({
        cliente_id: '',
        serie: 'A',
        forma_pago: '',
        metodo_pago: '',
        uso_cfdi: '',
        condiciones_pago: '',
        conceptos: [
            {
                clave_prod_serv: '',
                clave_unidad: '',
                descripcion: '',
                cantidad: 1,
                valor_unitario: 0,
                descuento: 0,
            }
        ]
    });

    useEffect(() => {
        fetchCatalogos();
    }, []);

    const fetchCatalogos = async () => {
        try {
            const [clientesRes, formasPagoRes, metodosPagoRes, usosCFDIRes] = await Promise.all([
                fetch('/api/contabilidad/clientes/'),
                fetch('/api/contabilidad/cfdi-formas-pago/'),
                fetch('/api/contabilidad/cfdi-metodos-pago/'),
                fetch('/api/contabilidad/cfdi-usos-cfdi/'),
            ]);

            setClientes(await clientesRes.json());
            setFormasPago(await formasPagoRes.json());
            setMetodosPago(await metodosPagoRes.json());
            setUsosCFDI(await usosCFDIRes.json());
        } catch (error) {
            console.error('Error fetching catalogos:', error);
        }
    };

    const handleAddConcepto = () => {
        setFactura({
            ...factura,
            conceptos: [
                ...factura.conceptos,
                {
                    clave_prod_serv: '01010101',
                    clave_unidad: 'E48',
                    descripcion: '',
                    cantidad: 1,
                    valor_unitario: 0,
                    descuento: 0,
                }
            ]
        });
    };

    const handleRemoveConcepto = (index) => {
        const newConceptos = factura.conceptos.filter((_, i) => i !== index);
        setFactura({ ...factura, conceptos: newConceptos });
    };

    const handleConceptoChange = (index, field, value) => {
        const newConceptos = [...factura.conceptos];
        newConceptos[index][field] = value;
        setFactura({ ...factura, conceptos: newConceptos });
    };

    const calculateSubtotal = () => {
        return factura.conceptos.reduce((sum, concepto) => {
            const importe = concepto.cantidad * concepto.valor_unitario;
            return sum + importe - (concepto.descuento || 0);
        }, 0);
    };

    const calculateIVA = () => {
        return calculateSubtotal() * 0.16;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateIVA();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/contabilidad/facturas/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...factura,
                    subtotal: calculateSubtotal(),
                    total: calculateTotal(),
                    moneda: 'MXN',
                    tipo_cambio: 1.0,
                    tipo_comprobante: 'I',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Factura creada exitosamente');
                router.push(`/facturas/${data.id}`);
            } else {
                const error = await response.json();
                alert(`Error: ${JSON.stringify(error)}`);
            }
        } catch (error) {
            alert('Error al crear factura');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Nueva Factura</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Crear nueva factura electrónica CFDI 4.0
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Datos Generales */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Generales</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cliente *
                                </label>
                                <select
                                    required
                                    value={factura.cliente_id}
                                    onChange={(e) => setFactura({ ...factura, cliente_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.id} value={cliente.id}>
                                            {cliente.nombre_completo} - {cliente.rfc}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Serie
                                </label>
                                <input
                                    type="text"
                                    value={factura.serie}
                                    onChange={(e) => setFactura({ ...factura, serie: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    maxLength={10}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Forma de Pago *
                                </label>
                                <select
                                    required
                                    value={factura.forma_pago}
                                    onChange={(e) => setFactura({ ...factura, forma_pago: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar</option>
                                    {formasPago.map((forma) => (
                                        <option key={forma.clave} value={forma.clave}>
                                            {forma.clave} - {forma.descripcion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Método de Pago *
                                </label>
                                <select
                                    required
                                    value={factura.metodo_pago}
                                    onChange={(e) => setFactura({ ...factura, metodo_pago: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar</option>
                                    {metodosPago.map((metodo) => (
                                        <option key={metodo.clave} value={metodo.clave}>
                                            {metodo.clave} - {metodo.descripcion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Condiciones de Pago
                                </label>
                                <input
                                    type="text"
                                    value={factura.condiciones_pago}
                                    onChange={(e) => setFactura({ ...factura, condiciones_pago: e.target.value })}
                                    placeholder="Ej: Pago a 30 días"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conceptos */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Conceptos</h2>
                            <button
                                type="button"
                                onClick={handleAddConcepto}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Agregar Concepto
                            </button>
                        </div>

                        <div className="space-y-4">
                            {factura.conceptos.map((concepto, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-700">Concepto {index + 1}</h3>
                                        {factura.conceptos.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveConcepto(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="md:col-span-4">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Descripción *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={concepto.descripcion}
                                                onChange={(e) => handleConceptoChange(index, 'descripcion', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Cantidad *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                value={concepto.cantidad}
                                                onChange={(e) => handleConceptoChange(index, 'cantidad', parseFloat(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Precio Unitario *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                step="0.01"
                                                value={concepto.valor_unitario}
                                                onChange={(e) => handleConceptoChange(index, 'valor_unitario', parseFloat(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Descuento
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={concepto.descuento}
                                                onChange={(e) => handleConceptoChange(index, 'descuento', parseFloat(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Importe
                                            </label>
                                            <input
                                                type="text"
                                                disabled
                                                value={`$${((concepto.cantidad * concepto.valor_unitario) - (concepto.descuento || 0)).toFixed(2)}`}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totales */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Totales</h2>
                        <div className="space-y-2 max-w-sm ml-auto">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">IVA (16%):</span>
                                <span className="font-medium">${calculateIVA().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total:</span>
                                <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Guardar Factura'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
