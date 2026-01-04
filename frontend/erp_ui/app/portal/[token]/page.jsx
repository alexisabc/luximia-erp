'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Mock function to simulate upload
const uploadInvoice = async (token, file) => {
    // En produccion: POST /api/proveedores/upload { token, file }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (file.name.includes("invalid")) reject("Error: El monto no coincide ($900 vs $1000).");
            else resolve({ success: true, message: "Factura validada y programada para pago." });
        }, 1500);
    });
};

const VendorPortalPage = () => {
    const params = useParams();
    const token = params?.token;

    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('IDLE');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus('UPLOADING');
        try {
            const res = await uploadInvoice(token, file);
            setStatus('SUCCESS');
            setMessage(res.message);
        } catch (err) {
            setStatus('ERROR');
            setMessage(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-black p-6 text-white text-center">
                    <h1 className="text-xl font-bold tracking-tight">LUXIMIA ERP</h1>
                    <p className="text-gray-400 text-sm mt-1">Portal de Proveedores</p>
                </div>

                <div className="p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-semibold text-gray-800">Subida de Factura</h2>
                        <p className="text-sm text-gray-500">Orden de Compra vinculada al token</p>
                        <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded break-all">
                            {token && token.length > 20 ? token.substring(0, 20) + '...' : token}
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept=".xml"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div className="text-sm font-medium text-green-600 truncate">
                                {file.name}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm">
                                <p className="mb-1">Arrastra tu XML aquí</p>
                                <p className="text-xs">o haz click para buscar</p>
                            </div>
                        )}
                    </div>

                    {status === 'ERROR' && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                            <span>⚠️</span>
                            <p>{message}</p>
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="mt-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-start gap-2">
                            <span>✅</span>
                            <p>{message}</p>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || status === 'UPLOADING' || status === 'SUCCESS'}
                        className="w-full mt-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'UPLOADING' ? 'Validando...' : 'Subir y Validar'}
                    </button>
                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                    &copy; 2026 Luximia. Conexión Segura SSL.
                </div>
            </div>
        </div>
    );
};

export default VendorPortalPage;
