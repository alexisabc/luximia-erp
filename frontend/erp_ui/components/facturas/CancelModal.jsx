'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MOTIVOS_CANCELACION = [
    {
        codigo: '01',
        descripcion: 'Comprobante emitido con errores con relación',
        requiere_sustitucion: true
    },
    {
        codigo: '02',
        descripcion: 'Comprobante emitido con errores sin relación',
        requiere_sustitucion: false
    },
    {
        codigo: '03',
        descripcion: 'No se llevó a cabo la operación',
        requiere_sustitucion: false
    },
    {
        codigo: '04',
        descripcion: 'Operación nominativa relacionada en una factura global',
        requiere_sustitucion: false
    }
];

export default function CancelModal({ isOpen, onClose, factura, onSuccess }) {
    const [motivo, setMotivo] = useState('02');
    const [uuidSustitucion, setUuidSustitucion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const motivoSeleccionado = MOTIVOS_CANCELACION.find(m => m.codigo === motivo);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validar UUID de sustitución si es requerido
        if (motivoSeleccionado?.requiere_sustitucion && !uuidSustitucion) {
            setError('Debes proporcionar el UUID de la factura que sustituye');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`/api/facturas/${factura.id}/cancelar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    motivo,
                    uuid_sustitucion: uuidSustitucion || null
                })
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Error al cancelar la factura');
            }
        } catch (err) {
            setError('Error de conexión al cancelar la factura');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Cancelar Factura
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Advertencia */}
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Advertencia:</strong> Esta acción cancelará la factura en el SAT y no se puede deshacer.
                            </p>
                        </div>

                        {/* Información de factura */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Folio: <span className="font-medium">{factura.folio}</span></p>
                            <p className="text-sm text-gray-600">UUID: <span className="font-mono text-xs">{factura.uuid}</span></p>
                            <p className="text-sm text-gray-600">Total: <span className="font-medium">${factura.total}</span></p>
                        </div>

                        {/* Selector de motivo */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo de cancelación *
                            </label>
                            <select
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {MOTIVOS_CANCELACION.map((m) => (
                                    <option key={m.codigo} value={m.codigo}>
                                        {m.codigo} - {m.descripcion}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* UUID de sustitución (condicional) */}
                        {motivoSeleccionado?.requiere_sustitucion && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    UUID de factura que sustituye *
                                </label>
                                <input
                                    type="text"
                                    value={uuidSustitucion}
                                    onChange={(e) => setUuidSustitucion(e.target.value)}
                                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    UUID de la nueva factura que reemplaza a esta
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
