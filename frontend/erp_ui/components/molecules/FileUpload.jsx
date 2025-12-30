/**
 * FileUpload Molecule - Carga de archivos
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para subir archivos con drag & drop
 */
'use client';

import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/atoms/Button';

/**
 * @typedef {Object} FileUploadProps
 * @property {Function} [onFileSelect] - Callback al seleccionar archivo
 * @property {string[]} [accept] - Tipos de archivo aceptados
 * @property {number} [maxSize=5] - Tamaño máximo en MB
 * @property {boolean} [multiple=false] - Permitir múltiples archivos
 * @property {string} [label] - Etiqueta del campo
 * @property {string} [description] - Descripción/ayuda
 * @property {boolean} [required=false] - Campo requerido
 * @property {string} [error] - Mensaje de error
 * @property {string} [className=''] - Clases adicionales
 */

export default function FileUpload({
    onFileSelect,
    accept = [],
    maxSize = 5,
    multiple = false,
    label,
    description,
    required = false,
    error,
    className = '',
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const validateFile = (file) => {
        // Validar tamaño
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            return `El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`;
        }

        // Validar tipo
        if (accept.length > 0) {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const mimeType = file.type;
            const isValid = accept.some(type =>
                type === mimeType || type === fileExtension
            );
            if (!isValid) {
                return `El archivo ${file.name} no es un tipo permitido`;
            }
        }

        return null;
    };

    const handleFiles = (files) => {
        const fileArray = Array.from(files);
        const errors = [];
        const validFiles = [];

        fileArray.forEach(file => {
            const error = validateFile(file);
            if (error) {
                errors.push(error);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            setUploadError(errors[0]);
            return;
        }

        setUploadError('');
        setSelectedFiles(multiple ? [...selectedFiles, ...validFiles] : validFiles);
        onFileSelect?.(multiple ? validFiles : validFiles[0]);
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
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFileSelect?.(multiple ? newFiles : null);
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const acceptString = accept.join(',');

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
                className={`
                    relative
                    border-2 border-dashed rounded-lg
                    p-6 sm:p-8
                    text-center
                    cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                    ${error || uploadError ? 'border-red-500' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInput}
                    accept={acceptString}
                    multiple={multiple}
                    className="hidden"
                />

                <Upload className={`
                    w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3
                    ${isDragging ? 'text-primary' : 'text-gray-400'}
                    transition-colors duration-200
                `} />

                <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
                </p>

                {description && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}

                {accept.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Formatos: {accept.join(', ')}
                    </p>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Tamaño máximo: {maxSize}MB
                </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="
                                flex items-center justify-between
                                p-3 rounded-lg
                                bg-gray-50 dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700
                                animate-in fade-in slide-in-from-bottom-2 duration-200
                            "
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <File className="w-5 h-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="
                                    ml-2 p-1 rounded-full
                                    hover:bg-gray-200 dark:hover:bg-gray-700
                                    transition-colors duration-200
                                    touch-target
                                "
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Error Message */}
            {(error || uploadError) && (
                <div className="mt-2 flex items-start gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm">{error || uploadError}</p>
                </div>
            )}
        </div>
    );
}
