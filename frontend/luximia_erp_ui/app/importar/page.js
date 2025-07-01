// app/importar/page.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { importarDatosMasivos } from '../../services/api';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function ImportarPage() {
    const { hasPermission } = useAuth(); // Obtenemos la función de permisos

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

    const handleDownloadTemplate = () => {
        const headers = [
            'proyecto_nombre', 'upe_identificador', 'upe_valor_total', 'upe_moneda', 'upe_estado',
            'cliente_nombre', 'cliente_email', 'cliente_telefono',
            'contrato_fecha_venta', 'contrato_precio_pactado', 'contrato_moneda'
        ];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'plantilla_importacion_masiva.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setError(null);
        }
    };
    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setError(null);
        }
    };
    const handleZoneClick = () => { fileInputRef.current.click(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Por favor, selecciona un archivo CSV para subir.');
            return;
        }
        setIsUploading(true);
        setError(null);
        setUploadResponse(null);
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            const response = await importarDatosMasivos(formData);
            setUploadResponse(response.data);
            setSelectedFile(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error desconocido al subir el archivo.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!hasMounted) {
        return null;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Importación de Datos</h1>

            {/* El importador masivo solo se muestra si el usuario tiene permiso para añadir UPEs (como regla de ejemplo) */}
            {hasPermission('api.add_upe') && (
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700">Importador Masivo Completo</h2>
                        <button onClick={handleDownloadTemplate} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 text-sm rounded-lg">
                            Descargar Plantilla Maestra
                        </button>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Sube un archivo <strong>.csv</strong> con la estructura completa para crear o actualizar todos los registros.
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div
                            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
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
                            <button type="submit" disabled={!selectedFile || isUploading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                                {isUploading ? 'Procesando...' : 'Subir y Procesar Archivo'}
                            </button>
                        </div>
                    </form>
                    {uploadResponse && (
                        <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <strong className="font-bold">¡Éxito! {uploadResponse.mensaje}</strong>
                            {/* ... (código para mostrar el resumen) ... */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}