'use client';

import React, { useState } from 'react';
import Modal from '@/components/modals';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download } from 'lucide-react';
import apiClient from '@/services/core';

export default function ImportModal({ isOpen, onClose, onImport, onSuccess, templateUrl }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setMessage(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
            setError(null);
            setMessage(null);
        } else {
            setError('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;
        setIsUploading(true);
        setError(null);
        setMessage(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await onImport(formData);
            setMessage(res.data?.mensaje || 'Importación completada');
            setFile(null);
            onSuccess && onSuccess(res);
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al importar.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        onClose();
        setFile(null);
        setError(null);
        setMessage(null);
    };

    return (
        <Modal title="Importar desde Excel" isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6">

                <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-gray-50/50 dark:bg-gray-800/30 ${isDragging
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {file ? (
                        <div className="flex flex-col items-center animate-in zoom-in-50 duration-200">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                                <FileSpreadsheet className="w-8 h-8" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white text-center break-all">{file.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setFile(null); }}
                                className="mt-4 text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 z-10"
                            >
                                <X className="w-3 h-3" /> Remover archivo
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 text-gray-400">
                                <Upload className="w-7 h-7" />
                            </div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Haz clic para subir o arrastra tu archivo</p>
                            <p className="text-sm text-gray-500 mt-1">Soporta .xlsx, .xls, .csv</p>
                        </>
                    )}
                </div>

                <div className="flex justify-end">
                    {templateUrl && (
                        <button
                            type="button"
                            onClick={async (e) => {
                                e.preventDefault();
                                try {
                                    const response = await apiClient.get(templateUrl, { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    // Extract filename from header or default
                                    const contentDisposition = response.headers['content-disposition'];
                                    let fileName = 'plantilla.xlsx';
                                    if (contentDisposition) {
                                        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                                        if (fileNameMatch.length === 2)
                                            fileName = fileNameMatch[1];
                                    }
                                    link.setAttribute('download', fileName);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                } catch (err) {
                                    console.error("Error downloading template", err);
                                    setError("No se pudo descargar la plantilla.");
                                }
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Descargar Plantilla de Ejemplo
                        </button>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none w-full sm:w-auto"
                    >
                        {isUploading ? 'Importando...' : 'Comenzar Importación'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
