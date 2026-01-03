'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useConfig } from '@/contexts/ConfigContext';
import { SettingSwitch } from '@/components/config/SettingSwitch';
import { Shield, Key, FileText, Upload, CheckCircle, AlertTriangle, Eye, EyeOff, Lock, RefreshCw } from 'lucide-react';

export default function FiscalConfigPage() {
    const { refreshConfig } = useConfig();
    const [empresaFiscal, setEmpresaFiscal] = useState(null);
    const [loading, setLoading] = useState(true);

    // Upload State
    const [cerFile, setCerFile] = useState(null);
    const [keyFile, setKeyFile] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchFiscalData();
    }, []);

    const fetchFiscalData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/contabilidad/configuracion-fiscal/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.results && res.data.results.length > 0) {
                setEmpresaFiscal(res.data.results[0]);
            } else if (Array.isArray(res.data) && res.data.length > 0) {
                setEmpresaFiscal(res.data[0]);
            }
        } catch (error) {
            console.error('Error fetching fiscal data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!cerFile || !keyFile || !password) {
            setMessage({ type: 'error', text: 'Todos los campos son obligatorios.' });
            return;
        }

        const formData = new FormData();
        formData.append('cer_file', cerFile);
        formData.append('key_file', keyFile);
        formData.append('password', password);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/contabilidad/configuracion-fiscal/upload_csd/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage({ type: 'success', text: 'Certificado cargado correctamente.' });
            fetchFiscalData();
            setPassword('');
            setCerFile(null);
            setKeyFile(null);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al cargar certificados.';
            const detail = error.response?.data?.detail || '';
            setMessage({ type: 'error', text: `${errorMsg} ${detail}` });
        } finally {
            setUploading(false);
        }
    };

    if (loading && !empresaFiscal) return <div className="p-8 text-center">Cargando datos fiscales...</div>;

    const cert = empresaFiscal?.certificado_sello;
    const isActive = cert?.activo;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        La Bóveda Fiscal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestión de Certificados de Sello Digital (CSD) y Configuración</p>
                </div>
                <button onClick={fetchFiscalData} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-700">
                    <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            </header>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Datos Fiscales */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-500" />
                        Datos de Emisión
                    </h2>
                    {empresaFiscal ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-gray-500 text-xs">Razón Social</label>
                                <div className="font-medium">{empresaFiscal.empresa?.razon_social}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">RFC</label>
                                <div className="font-medium font-mono bg-gray-50 dark:bg-gray-700 inline-block px-2 py-1 rounded">
                                    {empresaFiscal.empresa?.rfc}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">Régimen Fiscal</label>
                                <div className="font-medium">{empresaFiscal.regimen_fiscal_codigo}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">Código Postal</label>
                                <div className="font-medium">{empresaFiscal.codigo_postal}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-yellow-600 text-sm">No hay empresa fiscal configurada.</div>
                    )}
                </div>

                {/* 2. CSD Management */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Key className="w-5 h-5 text-amber-500" />
                        Certificado Sello Digital
                    </h2>

                    {isActive ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-green-800 dark:text-green-300">Certificado Activo</h3>
                                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                        Vence: {new Date(cert.fecha_fin_validez).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5 font-mono">
                                        Serie: {cert.numero_serie}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEmpresaFiscal((prev) => ({ ...prev, certificado_sello: null }))}
                                className="mt-4 text-sm text-green-700 underline hover:text-green-800"
                            >
                                Reemplazar Certificado
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Archivo .cer</label>
                                <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="file"
                                        accept=".cer,.pem"
                                        onChange={(e) => setCerFile(e.target.files?.[0] || null)}
                                        className="text-sm w-full file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Archivo .key</label>
                                <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="file"
                                        accept=".key,.pem"
                                        onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                                        className="text-sm w-full file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Contraseña de Clave Privada</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {message.text && (
                                <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {message.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? 'Validando...' : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Cargar y Validar
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* 3. Configuración Avanzada */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Configuración Avanzada</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SettingSwitch settingKey="FISCAL_SANDBOX_MODE" label="Modo Sandbox (Pruebas)" description="Si activo, no se timbrará realmente ante el SAT." />
                        <SettingSwitch settingKey="FISCAL_PAC_PROVIDER" label="Mock PAC Provider" description="Forzar uso de Provider Mock (Solo desarrollo)." />
                    </div>
                </div>

            </div>
        </div>
    );
}
