'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Interfaces
interface SystemSetting {
    key: string;
    value: any;
    category: string;
    description: string;
    is_public: boolean;
}

interface FeatureFlag {
    code: string;
    name: string;
    is_active: boolean;
    rollout_percentage: number;
}

interface ConfigContextType {
    settings: Record<string, any>;
    features: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;
    getSetting: (key: string, defaultValue?: any) => any;
    isFeatureEnabled: (code: string) => boolean;
    refreshConfig: () => Promise<void>;
}

// Contexto
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Provider
export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [features, setFeatures] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Función para cargar configuraciones
    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/core/config/public/', {
                headers: {
                    'Content-Type': 'application/json',
                    // Agregar token si es necesario
                    ...(typeof window !== 'undefined' && localStorage.getItem('token')
                        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        : {}),
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            setSettings(data.settings || {});
            setFeatures(data.features || {});

            // Guardar en localStorage para acceso offline
            if (typeof window !== 'undefined') {
                localStorage.setItem('erp_config', JSON.stringify(data));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('Error cargando configuración:', err);

            // Intentar cargar desde localStorage como fallback
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem('erp_config');
                if (cached) {
                    try {
                        const data = JSON.parse(cached);
                        setSettings(data.settings || {});
                        setFeatures(data.features || {});
                        console.warn('Usando configuración en cache');
                    } catch (parseErr) {
                        console.error('Error parseando cache:', parseErr);
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cargar al montar
    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Helper: Obtener un setting
    const getSetting = useCallback(
        (key: string, defaultValue: any = null) => {
            return settings[key] !== undefined ? settings[key] : defaultValue;
        },
        [settings]
    );

    // Helper: Verificar si un feature está habilitado
    const isFeatureEnabled = useCallback(
        (code: string) => {
            return features[code] === true;
        },
        [features]
    );

    // Función para refrescar configuración
    const refreshConfig = useCallback(async () => {
        await loadConfig();
    }, [loadConfig]);

    const value: ConfigContextType = {
        settings,
        features,
        isLoading,
        error,
        getSetting,
        isFeatureEnabled,
        refreshConfig,
    };

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

// Hook principal
export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig debe usarse dentro de un ConfigProvider');
    }
    return context;
}

// Hook helper para un setting específico
export function useSetting<T = any>(key: string, defaultValue?: T): T {
    const { getSetting } = useConfig();
    return getSetting(key, defaultValue);
}

// Hook helper para un feature flag
export function useFeature(code: string): boolean {
    const { isFeatureEnabled } = useConfig();
    return isFeatureEnabled(code);
}

// Hook para verificar si está cargando
export function useConfigLoading(): boolean {
    const { isLoading } = useConfig();
    return isLoading;
}
