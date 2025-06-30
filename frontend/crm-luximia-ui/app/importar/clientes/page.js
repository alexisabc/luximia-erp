// app/importar/clientes/page.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { importarClientes } from '../../../services/api'; // Usamos la nueva función específica para clientes
import Link from 'next/link';


export default function ImportarClientesPage() {
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

    // La plantilla ahora solo contiene las cabeceras para los clientes
    const handleDownloadTemplate = () => {
        const headers = ['nombre_completo', 'email', 'telefono'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'plantilla_clientes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setError(null);
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
            // Llamamos a la función específica para importar clientes
            const response = await importarClientes(formData);
            setUploadResponse(response.data);
            setSelectedFile(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al subir el archivo.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!hasMounted) return null;

    return (
        <div className="p-8">
            
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Importación Exclusiva de Clientes</h1>

            <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Sube un archivo <strong>.csv</strong> solo con datos de clientes.</p>
                    <button onClick={handleDownloadTemplate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-sm rounded-lg">
                        Descargar Plantilla
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleZoneClick}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {selectedFile ? (
                            <p className="text-green-600 font-semibold">Archivo seleccionado: {selectedFile.name}</p>
                        ) : (
                            <p className="text-gray-500">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={!selectedFile || isUploading}
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Procesando...' : 'Subir y Procesar Clientes'}
                        </button>
                    </div>
                </form>

                {/* Sección de resultados actualizada para el resumen de clientes */}
                <div className="mt-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {uploadResponse && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                            <strong className="font-bold">{uploadResponse.mensaje}</strong>
                            <div className="text-sm mt-2">
                                <p>Nuevos Clientes Creados: {uploadResponse.clientes_creados}</p>
                                <p>Clientes Existentes Actualizados: {uploadResponse.clientes_actualizados}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}