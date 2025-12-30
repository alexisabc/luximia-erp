'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings, Save, Upload, Image as ImageIcon,
    Globe, Landmark, BadgePercent, Clock, MessageSquare,
    Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfig } from '@/context/ConfigContext';
import configService from '@/services/config.service';

const ConfigField = ({ label, icon: Icon, description, children }) => (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 transition-all hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white">{label}</label>
                {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
        </div>
        <div className="mt-1">
            {children}
        </div>
    </div>
);

const ImageUploader = ({ label, currentImage, onSelect, icon: Icon }) => {
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
            </div>

            <div className="relative group aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors hover:border-blue-400 dark:hover:border-blue-500">
                {(preview || currentImage) ? (
                    <img
                        src={preview || currentImage}
                        alt={label}
                        className="w-full h-full object-contain p-2"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Subir imagen</span>
                    </div>
                )}
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default function ConfiguracionPage() {
    const { config, refreshConfig } = useConfig();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('identidad');
    const [formData, setFormData] = useState({
        nombre_sistema: '',
        iva_default: '',
        moneda_base: '',
        retencion_isr: '',
        mensaje_ticket_pie: '',
        dias_vencimiento_cotizacion: '',
    });
    const [files, setFiles] = useState({
        logo_login: null,
        logo_ticket: null,
        favicon: null
    });

    useEffect(() => {
        if (config) {
            setFormData({
                nombre_sistema: config.nombre_sistema || '',
                iva_default: config.iva_default || '',
                moneda_base: config.moneda_base || 'MXN',
                retencion_isr: config.retencion_isr || '0.00',
                mensaje_ticket_pie: config.mensaje_ticket_pie || '',
                dias_vencimiento_cotizacion: config.dias_vencimiento_cotizacion || 15,
            });
        }
    }, [config]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (name, file) => {
        setFiles(prev => ({ ...prev, [name]: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        Object.keys(files).forEach(key => {
            if (files[key]) data.append(key, files[key]);
        });

        try {
            await configService.updateConfig(data);
            toast.success('Configuración actualizada correctamente');
            refreshConfig();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'identidad', label: 'Identidad', icon: Globe },
        { id: 'fiscal', label: 'Fiscal y Financiero', icon: Landmark },
        { id: 'operativo', label: 'Operación', icon: Clock },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                            Configuración Global
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Administra la identidad visual y parámetros base del ERP.
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span className="font-semibold text-sm">Guardar Cambios</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-6 w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {activeTab === 'identidad' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <div className="md:col-span-2">
                                <ConfigField
                                    label="Nombre del Sistema"
                                    icon={Globe}
                                    description="Se mostrará en la pestaña del navegador y barra lateral."
                                >
                                    <input
                                        type="text"
                                        name="nombre_sistema"
                                        value={formData.nombre_sistema}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </ConfigField>
                            </div>

                            <ImageUploader
                                label="Logo Login"
                                currentImage={config.logo_login}
                                onSelect={(file) => handleFileSelect('logo_login', file)}
                                icon={ImageIcon}
                            />

                            <ImageUploader
                                label="Logo Ticket (B/N)"
                                currentImage={config.logo_ticket}
                                onSelect={(file) => handleFileSelect('logo_ticket', file)}
                                icon={Clock}
                            />

                            <div className="md:col-span-2">
                                <ImageUploader
                                    label="Favicon (Icono Navegador)"
                                    currentImage={config.favicon}
                                    onSelect={(file) => handleFileSelect('favicon', file)}
                                    icon={Globe}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'fiscal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <ConfigField
                                label="IVA Predeterminado"
                                icon={BadgePercent}
                                description="Porcentaje de IVA aplicado a nuevos productos y servicios."
                            >
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="iva_default"
                                        value={formData.iva_default}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                </div>
                            </ConfigField>

                            <ConfigField
                                label="Moneda Base"
                                icon={Landmark}
                                description="Moneda principal para cálculos contables y reportes."
                            >
                                <select
                                    name="moneda_base"
                                    value={formData.moneda_base}
                                    onChange={handleInputChange}
                                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="MXN">Peso Mexicano (MXN)</option>
                                    <option value="USD">Dólar Americano (USD)</option>
                                </select>
                            </ConfigField>

                            <div className="md:col-span-2">
                                <ConfigField
                                    label="Retención ISR"
                                    icon={BadgePercent}
                                    description="Tasa de retención de ISR aplicada en facturación si aplica."
                                >
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="retencion_isr"
                                            value={formData.retencion_isr}
                                            onChange={handleInputChange}
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                    </div>
                                </ConfigField>
                            </div>
                        </div>
                    )}

                    {activeTab === 'operativo' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <div className="md:col-span-2">
                                <ConfigField
                                    label="Mensaje Pie de Ticket"
                                    icon={MessageSquare}
                                    description="Texto que aparecerá al final de todos los tickets generados por el POS."
                                >
                                    <textarea
                                        name="mensaje_ticket_pie"
                                        value={formData.mensaje_ticket_pie}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    />
                                </ConfigField>
                            </div>

                            <div className="md:col-span-2">
                                <ConfigField
                                    label="Días Vencimiento Cotización"
                                    icon={Clock}
                                    description="Tiempo de validez predeterminado para las cotizaciones de venta."
                                >
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="dias_vencimiento_cotizacion"
                                            value={formData.dias_vencimiento_cotizacion}
                                            onChange={handleInputChange}
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-3 pr-16 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm italic">días</span>
                                    </div>
                                </ConfigField>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
