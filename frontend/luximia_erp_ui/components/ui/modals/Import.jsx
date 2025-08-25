'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/modals';

export default function ImportModal({ isOpen, onClose, onImport, onSuccess }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        setFile(e.target.files[0] || null);
        setError(null);
        setMessage(null);
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
        <Modal title="Importar desde Excel" isOpen={isOpen} onClose={handleClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="file"
                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 dark:text-gray-300"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                {message && <p className="text-green-600 text-sm">{message}</p>}
                <div className="pt-4 flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Importando...' : 'Importar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
