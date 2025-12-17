'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function DataImporter({ config }) {
    const { label, headers, templateName, description, buttonText, importFn } = config;
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResponse, setUploadResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDownloadTemplate = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', templateName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            setUploadResponse(null);
        }
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            setUploadResponse(null);
        }
    };

    const handleZoneClick = () => fileInputRef.current.click();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);
        setUploadResponse(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await importFn(formData);
            setUploadResponse(response.data);
            setSelectedFile(null);
        } catch (err) {
            const errorData = err.response?.data;
            setError(errorData?.mensaje || errorData?.error || 'Ocurrió un error al subir el archivo.');
            if (errorData?.errores) {
                setUploadResponse({ errores: errorData.errores });
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-3xl mx-auto transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                </div>
                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-xl transition-all duration-200 text-sm border border-gray-200 dark:border-gray-700"
                >
                    <Download className="w-4 h-4" />
                    Plantilla CSV
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div
                    className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 
            ${isDragging
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleZoneClick}
                >
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className={`p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                            <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            {selectedFile ? (
                                <>
                                    <p className="text-lg font-semibold text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-bottom-2">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-700 dark:text-gray-200 font-medium">
                                        Arrastra tu archivo aquí o haz clic para explorar
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Solo archivos .csv permitidos
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className={`w-full relative overflow-hidden flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300
            ${!selectedFile || isUploading
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-blue-500/25 hover:-translate-y-0.5'
                        }`}
                >
                    {isUploading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Procesando...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5" />
                            <span>{buttonText}</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 space-y-4">
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong className="font-bold block">Error al procesar</strong>
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {uploadResponse?.mensaje && (
                    <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong className="font-bold block">¡Éxito!</strong>
                            <span className="text-sm">{uploadResponse.mensaje}</span>
                        </div>
                    </div>
                )}

                {uploadResponse?.errores && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Detalles del proceso:
                        </h4>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar p-2">
                            <ul className="space-y-2">
                                {uploadResponse.errores.map((errMsg, idx) => (
                                    <li key={idx} className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                        <code>{errMsg}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
