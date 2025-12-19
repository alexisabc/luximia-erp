'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMisEmpresas, cambiarEmpresa as cambiarEmpresaAPI } from '@/services/core';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const EmpresaContext = createContext();

export function EmpresaProvider({ children }) {
    const [empresas, setEmpresas] = useState([]);
    const [empresaActual, setEmpresaActual] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshEmpresas = useCallback(async () => {
        try {
            const { data } = await getMisEmpresas();
            setEmpresas(data.empresas || []);
            setEmpresaActual(data.empresa_actual);

            // Si no hay empresa actual pero hay empresas, intentar seleccionar la primera
            if (!data.empresa_actual && data.empresas?.length > 0) {
                // Esto normalmente lo maneja el backend, pero por seguridad
                setEmpresaActual(data.empresas[0]);
            }
        } catch (error) {
            console.error('Error cargando empresas:', error);
            // No mostrar toast aquí para no saturar si es un error silencioso de red
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshEmpresas();
    }, [refreshEmpresas]);

    const cambiarEmpresa = async (empresaId) => {
        try {
            const { data } = await cambiarEmpresaAPI(empresaId);
            toast.success(`Cambiado a ${data.empresa.nombre_comercial}`);

            // Actualizar estado local inmediatamente para UX rápido
            setEmpresaActual(data.empresa);

            // Esperar un poco para asegurar que la cookie se guarde
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } catch (error) {
            console.error('Error cambiando empresa:', error);
            toast.error(error.response?.data?.detail || 'Error al cambiar de empresa');
            throw error;
        }
    };

    return (
        <EmpresaContext.Provider value={{
            empresas,
            empresaActual,
            loading,
            cambiarEmpresa,
            refreshEmpresas
        }}>
            {children}
        </EmpresaContext.Provider>
    );
}

export const useEmpresa = () => {
    const context = useContext(EmpresaContext);
    if (!context) {
        throw new Error('useEmpresa debe usarse dentro de un EmpresaProvider');
    }
    return context;
};
