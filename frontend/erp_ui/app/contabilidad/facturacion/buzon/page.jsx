'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileJson, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { uploadFacturasXMLs } from '@/services/accounting';
import { toast } from 'sonner';

export default function BuzonFiscalPage() {
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const formData = new FormData();
        acceptedFiles.forEach(file => {
            formData.append('xmls', file);
        });

        setUploading(true);
        setResults(null);
        try {
            const res = await uploadFacturasXMLs(formData);
            setResults(res.data);
            if (res.data.procesados > 0) {
                toast.success(`Se procesaron ${res.data.procesados} facturas correctamente.`);
            }
            if (res.data.errores > 0 || res.data.duplicados > 0) {
                toast.warning(`Algunos archivos no se pudieron cargar.`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al subir los archivos.");
        } finally {
            setUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/xml': ['.xml'],
            'application/xml': ['.xml']
        },
        multiple: true
    });

    return (
        <div className="space-y-6 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buzón Fiscal (XML)</h1>
                    <p className="text-sm text-gray-500">Sube tus archivos XML/CFDI para procesarlos automáticamente.</p>
                </div>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                    ${isDragActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.02]'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                            {isDragActive ? 'Suelta los archivos aquí...' : 'Arrastra y suelta tus XMLs aquí'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar</p>
                    </div>
                </div>
            </div>

            {/* Results */}
            {uploading && (
                <div className="text-center py-12">
                    <p className="text-blue-600 font-medium animate-pulse">Procesando archivos...</p>
                </div>
            )}

            {results && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="text-green-600 w-8 h-8" />
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{results.procesados}</p>
                                <p className="text-xs text-green-600">Procesados</p>
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 rounded-xl flex items-center gap-3">
                            <AlertCircle className="text-orange-600 w-8 h-8" />
                            <div>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{results.duplicados}</p>
                                <p className="text-xs text-orange-600">Duplicados</p>
                            </div>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 rounded-xl flex items-center gap-3">
                            <X className="text-red-600 w-8 h-8" />
                            <div>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{results.errores}</p>
                                <p className="text-xs text-red-600">Errores</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="font-medium text-sm">Detalle de Operación</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {results.detalles.map((d, i) => (
                                <div key={i} className="p-3 border-b border-gray-100 dark:border-gray-800 text-sm flex justify-between items-center last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileJson className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{d.archivo}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {d.status === 'success' ? (
                                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">OK</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Error</span>
                                        )}
                                        {d.mensaje && <span className="text-gray-500 text-xs max-w-xs truncate" title={d.mensaje}>{d.mensaje}</span>}
                                        {d.uuid && <span className="text-gray-400 text-xs font-mono">{d.uuid}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
