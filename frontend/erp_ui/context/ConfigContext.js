'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import configService from '@/services/config.service';
import { useAuth } from './AuthContext';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const { user } = useAuth();
    const [config, setConfig] = useState({
        nombre_sistema: 'Sistema ERP',
        logo_login: null,
        logo_ticket: null,
        favicon: null,
        iva_default: 16.00,
        moneda_base: 'MXN',
        mensaje_ticket_pie: 'Gracias por su compra',
        dias_vencimiento_cotizacion: 15
    });
    const [loading, setLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            // Si el usuario es admin, traemos la config completa
            // Si no, solo la pública
            let response;
            if (user?.is_staff || user?.is_superuser) {
                response = await configService.getAdminConfig();
            } else {
                response = await configService.getPublicConfig();
            }

            // Agregar timestamp a las imágenes para evitar caché si han cambiado
            const timestamp = Date.now();
            const data = response.data;

            const processUrl = (url) => url ? `${url}${url.includes('?') ? '&' : '?'}v=${timestamp}` : null;

            setConfig({
                ...data,
                logo_login: processUrl(data.logo_login),
                logo_ticket: processUrl(data.logo_ticket),
                favicon: processUrl(data.favicon)
            });
        } catch (error) {
            console.error('Error fetching global configuration:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Side effect to update document title and favicon
    useEffect(() => {
        if (config.nombre_sistema) {
            document.title = config.nombre_sistema;
        }
        if (config.favicon) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = config.favicon;
        }
    }, [config.nombre_sistema, config.favicon]);

    const refreshConfig = () => fetchConfig();

    return (
        <ConfigContext.Provider value={{ config, loading, refreshConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
