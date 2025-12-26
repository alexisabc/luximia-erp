import React, { useState } from 'react';
import Modal from '@/components/modals';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download, FileUp } from 'lucide-react';
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

    const downloadTemplate = async () => {
        if (!templateUrl) return;
        try {
            const response = await apiClient.get(templateUrl, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'plantilla.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
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
            // Slight delay to allow user to see success message before closing? 
            // Or maybe keep clear form. We'll leave as is for now.
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
        <Modal
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-bold">Importar Datos</span>
                        <span className="text-xs text-gray-500 font-normal">Sube tu archivo para actualización masiva</span>
                    </div>
                </div>
            }
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Template Download Section */}
                {templateUrl && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            <span>¿Necesitas el formato correcto?</span>
                        </div>
                        <button
                            type="button"
                            onClick={downloadTemplate}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Descargar Plantilla
                        </button>
                    </div>
                )}

                {/* Dropzone */}
                <div
                    className={`
                        relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[220px] group
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {file ? (
                        <div className="flex flex-col items-center animate-in zoom-in-50 duration-200 relative z-20">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <FileSpreadsheet className="w-8 h-8" />
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white text-center break-all text-lg mb-1">{file.name}</p>
                            <p className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }}
                                className="mt-6 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> Remover archivo
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-3 pointer-events-none">
                            <div className={`
                                w-16 h-16 rounded-full flex items-center justify-center mb-1 transition-colors duration-300
                                ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500'}
                            `}>
                                <Upload className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
                                    {isDragging ? '¡Suelta el archivo aquí!' : 'Sube tu archivo de datos'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                    Haz clic para explorar o arrastra y suelta tu archivo Excel (.xlsx, .csv) aquí.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {message && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
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
                        className={`
                            flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 w-full sm:w-auto
                            ${(!file || isUploading)
                                ? 'bg-gray-300 dark:bg-gray-700 shadow-none cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                            }
                        `}
                    >
                        {isUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FileUp className="w-4 h-4" />
                        )}
                        <span>{isUploading ? 'Importando...' : 'Comenzar Importación'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
