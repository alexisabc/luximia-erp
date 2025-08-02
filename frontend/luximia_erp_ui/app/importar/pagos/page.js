// app/importar/pagos/page.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
// ### CAMBIO: Importamos la función correcta ###
import { importarPagosHistoricos } from '../../../services/api';
import Link from 'next/link';

// ### CAMBIO: Renombramos el componente ###
export default function ImportarPagosPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResponse, setUploadResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // ### CAMBIO: Cabeceras para la plantilla de Pagos Históricos ###
    const handleDownloadTemplate = () => {
        const headers = [
            'CONTRATO_ID', // ID del contrato al que pertenece el pago
            'monto_pagado',
            'moneda_pagada', // MXN o USD
            'tipo_cambio', // Requerido si la moneda es USD
            'fecha_pago', // Formato: DD/MM/YYYY
            'concepto', // ABONO, INTERES, o COMPLETO
            'metodo_pago',
            'ordenante',
            'banco_origen',
            'num_cuenta_origen',
            'banco_destino',
            'cuenta_beneficiaria',
            'comentarios',
            'fecha_ingreso_cuentas' // Formato: DD/MM/YYYY (opcional)
        ];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'plantilla_pagos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setError(null);
            setUploadResponse(null);
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
            setError(null);
            setUploadResponse(null);
        }
    };

    const handleZoneClick = () => { fileInputRef.current.click(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Por favor, selecciona un archivo para subir.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResponse(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // ### CAMBIO: Llamamos a la función específica para importar pagos ###
            const response = await importarPagosHistoricos(formData);
            setUploadResponse(response.data);
            setSelectedFile(null);
        } catch (err) {
            const errorData = err.response?.data;
            // Adaptamos para recibir una lista de errores
            setError(errorData?.mensaje || errorData?.error || 'Ocurrió un error al subir el archivo.');
            if (errorData?.errores) {
                setUploadResponse({ errores: errorData.errores }); // Guardamos la lista de errores para mostrarla
            }
        } finally {
            setIsUploading(false);
        }
    };

    if (!hasMounted) return null;

    return (
        <div className="p-8">
            {/* ### CAMBIO: Título de la página ### */}
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">Importación de Pagos Históricos</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600 dark:text-gray-300">Sube un archivo <strong>.csv</strong> con el histórico de pagos.</p>
                    <button onClick={handleDownloadTemplate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-sm rounded-lg">
                        Descargar Plantilla
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}
                        onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleZoneClick}
                    >
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        {selectedFile ? (
                            <p className="text-green-600 font-semibold">Archivo seleccionado: {selectedFile.name}</p>
                        ) : (
                            <p className="text-gray-500">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <button type="submit" disabled={!selectedFile || isUploading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {/* ### CAMBIO: Texto del botón ### */}
                            {isUploading ? 'Procesando...' : 'Subir y Procesar Pagos'}
                        </button>
                    </div>
                </form>

                {/* ### CAMBIO: Sección de resultados adaptada para Pagos ### */}
                <div className="mt-6 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {uploadResponse && (
                        <div>
                            {/* Mensaje de éxito o de finalización con errores */}
                            <div className={`px-4 py-3 rounded ${uploadResponse.errores ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' : 'bg-green-100 border border-green-400 text-green-700'}`} role="alert">
                                <strong className="font-bold">{uploadResponse.mensaje}</strong>
                            </div>

                            {/* Lista de errores específicos si existen */}
                            {uploadResponse.errores && uploadResponse.errores.length > 0 && (
                                <div className="mt-4 bg-gray-100 dark:bg-gray-900 p-4 rounded max-h-48 overflow-y-auto">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Detalles de errores:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                        {uploadResponse.errores.map((err, index) => <li key={index}><code>{err}</code></li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}