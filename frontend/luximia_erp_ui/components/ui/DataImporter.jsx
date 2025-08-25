'use client';

import React, { useState, useRef } from 'react';

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
        <button
          onClick={handleDownloadTemplate}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-sm rounded-lg transition-colors duration-200"
        >
          Descargar Plantilla
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleZoneClick}
        >
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
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
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isUploading ? 'Procesando...' : buttonText}
          </button>
        </div>
      </form>
      <div className="mt-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {uploadResponse && uploadResponse.mensaje && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
            <strong className="font-bold">{uploadResponse.mensaje}</strong>
          </div>
        )}
        {uploadResponse && uploadResponse.errores && (
          <div className="mt-4 bg-gray-100 dark:bg-gray-900 p-4 rounded max-h-48 overflow-y-auto">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Detalles de errores:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {uploadResponse.errores.map((errMsg, idx) => (
                <li key={idx}><code>{errMsg}</code></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

