// context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const router = useRouter();

    const [authTokens, setAuthTokens] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const setAuthData = useCallback((tokens) => {
        try {
            const decoded = jwtDecode(tokens.access);
            setAuthTokens(tokens);
            // Corregido: Creamos un objeto de usuario explícito
            setUser({
                user_id: decoded.user_id,
                username: decoded.username,
                email: decoded.email,
                first_name: decoded.first_name,
                last_name: decoded.last_name,
                is_superuser: decoded.is_superuser,
                permissions: decoded.permissions,
            });
            localStorage.setItem('authTokens', JSON.stringify(tokens));
        } catch {
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
        }
    }, []);

    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        // Redirigir al login
        window.location.href = '/login';
    }, []);

    const hasPermission = useCallback((codename) => {
        if (user?.is_superuser) return true;
        return !!user?.permissions?.includes(codename);
    }, [user]);

    useEffect(() => {
        const loadAuth = async () => {
            const raw = localStorage.getItem('authTokens');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed?.access) {
                        const decoded = jwtDecode(parsed.access);
                        const expired = Date.now() >= decoded.exp * 1000;

                        // Si ha expirado y no hay token de refresco (o lógica adicional), limpiamos.
                        // Nota: El interceptor de Axios se encargará de refrescar si es posible.
                        // Aquí solo validamos estado inicial.
                        if (expired) {
                            // Podríamos intentar refrescar aquí, pero Axios lo hará en la primera petición.
                            // Dejamos que el estado persista hasta que falle el refresh.
                            // Opcional: localStorage.removeItem('authTokens'); // Si queremos ser estrictos
                            // Pero mantenerlo permite al interceptor intentar el refresh.
                            setAuthTokens(parsed);
                            // Aún decodificamos usuario para UI, sabiendo que puede fallar pronto.
                        } else {
                            setAuthTokens(parsed);
                        }

                        setUser({
                            user_id: decoded.user_id,
                            username: decoded.username,
                            email: decoded.email,
                            first_name: decoded.first_name,
                            last_name: decoded.last_name,
                            is_superuser: decoded.is_superuser,
                            permissions: decoded.permissions,
                        });
                    }
                } catch (e) {
                    console.error("Error loading auth:", e);
                    localStorage.removeItem('authTokens');
                }
            }
            setLoading(false);
        };

        loadAuth();

        // Listener para logout global disparado por Axios (core.js)
        const handleLogoutEvent = () => {
            // Limpiar estado de React
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
            // Redirigir
            window.location.href = '/login';
        };

        // Escuchar el evento custom
        window.addEventListener('auth:logout', handleLogoutEvent);

        return () => {
            window.removeEventListener('auth:logout', handleLogoutEvent);
        };
    }, [logoutUser]); // Dependencia estable

    const value = useMemo(() => ({
        user,
        authTokens,
        loading,
        setAuthData,
        logoutUser,
        hasPermission,
        isAuthenticated: !!authTokens,
    }), [user, authTokens, loading, setAuthData, logoutUser, hasPermission]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};