
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { importarNominaPagadora } from '@/services/rrhh';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ImportarNominaPage() {
    const router = useRouter();
    const [files, setFiles] = useState([]);
    const [year, setYear] = useState(2025);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            setResults(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            const validExtensions = ['.xlsx', '.xlsm', '.xls'];

            const validFiles = droppedFiles.filter(file => {
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                return validExtensions.includes(ext);
            });

            if (validFiles.length > 0) {
                setFiles(validFiles);
                setResults(null);
                if (validFiles.length < droppedFiles.length) {
                    toast.warning("Algunos archivos fueron ignorados por tener formato inválido");
                }
            } else {
                toast.error("Por favor sube archivos Excel válidos (.xlsx, .xlsm, .xls)");
            }
        }
    };

    const clearFiles = (e) => {
        e.stopPropagation();
        setFiles([]);
        setResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index, e) => {
        e.stopPropagation();
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
        if (newFiles.length === 0) setResults(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            toast.error("Selecciona al menos un archivo primero");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('anio', year);

        try {
            const response = await importarNominaPagadora(formData);
            setResults(response.data.results);
            if (response.data.global_errors && response.data.global_errors.length > 0) {
                toast.warning("Proceso completado con algunas advertencias");
            } else {
                toast.success("Proceso completado exitosamente");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al importar los archivos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-900/50">
            {/* Header */}
            <div className="flex-none mb-6">
                <Button variant="outline" className="mb-2" onClick={() => router.push('/rrhh/nominas')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Nóminas
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                        Importar Nómina Pagadora
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Integración masiva de históricos desde archivos Excel.
                    </p>
                </div>
            </div>

            {/* Main Content - No Scroll on outer div, inner scroll only */}
            <div className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6 h-full">

                {/* Panel Izquierdo: Carga */}
                <Card className="md:col-span-5 h-full flex flex-col border-0 shadow-md ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-950">
                    <CardHeader className="flex-none pb-4">
                        <CardTitle className="text-lg">Configuración de Archivos</CardTitle>
                        <CardDescription>Selecciona los archivos .xlsx y el año fiscal.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-6">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            <div className="space-y-4 flex-grow">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Año de Ejercicio</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        min="2020"
                                        max="2030"
                                    />
                                </div>

                                <div className="space-y-1.5 flex flex-col h-full max-h-[400px]">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Archivos de Nómina</label>
                                    <div
                                        className={`flex-grow border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-start overflow-y-auto
                                            ${isDragging
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : files.length > 0
                                                    ? 'border-emerald-400 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950/30'
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 justify-center'
                                            }
                                        `}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={(e) => {
                                            if (e.target === e.currentTarget || !files.length) document.getElementById('file-upload').click()
                                        }}
                                    >
                                        <input
                                            id="file-upload"
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".xlsx, .xlsm, .xls"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        {files.length > 0 ? (
                                            <div className="w-full space-y-2">
                                                <div className="flex justify-between items-center mb-2 px-2">
                                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{files.length} archivos seleccionados</span>
                                                    <Button variant="ghost" size="sm" className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={clearFiles}>
                                                        Borrar todos
                                                    </Button>
                                                </div>
                                                {files.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/80 dark:bg-gray-900/50 border border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                            <FileSpreadsheet className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-grow text-left min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate" title={f.name}>{f.name}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                {(f.size / 1024).toFixed(2)} KB
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-transparent"
                                                            onClick={(e) => removeFile(i, e)}
                                                        >
                                                            <span className="sr-only">Quitar</span>
                                                            &times;
                                                        </Button>
                                                    </div>
                                                ))}

                                                <div className="pt-2">
                                                    <Button variant="outline" size="sm" className="text-xs w-full border-dashed" onClick={() => document.getElementById('file-upload').click()}>
                                                        + Agregar más archivos
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-gray-400 py-8">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                                                    <FileSpreadsheet className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-600 dark:text-gray-300">Da clic o arrastra múltiples archivos</p>
                                                    <p className="text-xs mt-1">Soporta .xlsx, .xlsm, .xls</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-auto">
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 py-6 text-base"
                                    disabled={loading || files.length === 0}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Procesando {files.length} archivos...
                                        </div>
                                    ) : `Iniciar Importación (${files.length})`}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Panel Derecho: Resultados */}
                <div className="md:col-span-7 h-full flex flex-col min-h-0">
                    {results ? (
                        <Card className="h-full flex flex-col border-emerald-100 dark:border-emerald-900/20 bg-white dark:bg-gray-950 shadow-md">
                            <CardHeader className="flex-none pb-4 border-b border-gray-100 dark:border-gray-800 bg-emerald-50/10">
                                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle className="w-5 h-5" />
                                    Resultados del Proceso
                                </CardTitle>
                                <CardDescription>
                                    Se han procesado {results.reduce((acc, file) => acc + (file.sheets?.filter(s => s.status === 'success').length || 0), 0)} hojas exitosamente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow overflow-y-auto p-0">
                                <div className="p-6 space-y-6">
                                    {results.map((fileRes, fileIdx) => (
                                        <div key={fileIdx} className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-2">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                                                </div>
                                                <span>{fileRes.file}</span>
                                                <span className="text-xs font-normal text-gray-500 ml-auto">
                                                    {fileRes.sheets?.length || 0} hojas procesadas
                                                </span>
                                            </div>

                                            {fileRes.sheets && fileRes.sheets.map((res, sheetIdx) => (
                                                <div key={sheetIdx} className="group bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all ml-4 relative before:absolute before:left-[-17px] before:top-1/2 before:w-[17px] before:h-[2px] before:bg-gray-100 dark:before:bg-gray-800">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${res.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                {res.status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                            </div>
                                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{res.sheet}</h3>
                                                        </div>
                                                        <BadgeStatus status={res.status} />
                                                    </div>

                                                    {res.status === 'success' ? (
                                                        <div className="pl-11">
                                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                                <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    {res.processed} registros importados
                                                                </span>
                                                            </div>

                                                            {/* Lista de éxitos (nombres) */}
                                                            {res.processed_names && res.processed_names.length > 0 && (
                                                                <div className="mb-3 pl-3 border-l-2 border-emerald-100 dark:border-emerald-900/30">
                                                                    <p className="text-xs font-semibold text-gray-500 mb-1">Registros creados/actualizados:</p>
                                                                    <ul className="text-xs text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                                                                        {res.processed_names.map((name, i) => (
                                                                            <li key={i}>• {name}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {res.errors && res.errors.length > 0 ? (
                                                                <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 text-xs border border-amber-100 dark:border-amber-800/20">
                                                                    <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                                                                        <AlertTriangle className="w-3 h-3" /> Advertencias ({res.errors.length}):
                                                                    </p>
                                                                    <ul className="space-y-1 text-amber-600/90 dark:text-amber-500/90 pl-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 dark:scrollbar-thumb-amber-800">
                                                                        {res.errors.map((err, i) => (
                                                                            <li key={i} className="text-xs border-b last:border-0 border-amber-100 dark:border-amber-800/30 py-1">• {err}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ) : (
                                                                <p className="text-emerald-600 dark:text-emerald-500 text-xs pl-0.5 mt-1 font-medium">Todo correcto ✨</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="pl-11 h-8 flex items-center">
                                                            <p className="text-xs text-gray-400 italic">
                                                                Ignorada: {res.reason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <Button
                                            onClick={() => router.push('/rrhh/nominas/historico')}
                                            className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                        >
                                            Ver Histórico Centralizado Completo
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileSpreadsheet className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Esperando resultados</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto mt-2">
                                Carga un archivo en el panel izquierdo para ver aquí el detalle del procesamiento.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BadgeStatus({ status }) {
    const styles = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
        skipped: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        error: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
    };

    const labels = {
        success: "Exitoso",
        skipped: "Omitido",
        error: "Error"
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.skipped}`}>
            {labels[status] || status}
        </span>
    );
}
