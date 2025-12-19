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
                first_name: decoded.first_name, // <-- Extraemos y guardamos el nombre
                last_name: decoded.last_name,   // <-- Extraemos y guardamos el apellido
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
                const parsed = JSON.parse(raw);
                if (parsed?.access) {
                    const decoded = jwtDecode(parsed.access);
                    const expired = Date.now() >= decoded.exp * 1000;
                    if (expired) {
                        localStorage.removeItem('authTokens');
                    } else {
                        setAuthTokens(parsed);
                        // Corregido: Guardamos el objeto de usuario completo
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
                }
            }
            setLoading(false);
        };

        loadAuth();
    }, []);

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