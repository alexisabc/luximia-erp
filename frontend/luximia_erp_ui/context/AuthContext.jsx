// context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // indica si ya leímos localStorage

    useEffect(() => {
        const start = Date.now();
        let parsed = null;
        try {
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
                        setUser(decoded);
                    }
                }
            }
        } catch {
            // si algo falla, limpiamos
            localStorage.removeItem('authTokens');
            setAuthTokens(null);
            setUser(null);
        } finally {
            // pequeño delay opcional (suave UX), o quítalo si quieres instantáneo
            const elapsed = Date.now() - start;
            const waitMs = Math.max(0, 300 - elapsed);
            const t = setTimeout(() => setLoading(false), waitMs);
            return () => clearTimeout(t);
        }
    }, []);

    const setAuthData = (tokens) => {
        try {
            const decoded = jwtDecode(tokens.access);
            setAuthTokens(tokens);
            setUser(decoded);
            localStorage.setItem('authTokens', JSON.stringify(tokens));
        } catch {
            // token inválido recibido
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('luximia-erp-theme');
        window.location.href = '/login';
    };

    const hasPermission = (codename) => {
        if (user?.is_superuser) return true;
        return !!user?.permissions?.includes(codename);
    };

    const value = useMemo(() => ({
        user,
        authTokens,
        loading,
        setAuthData,
        logoutUser,
        hasPermission,
        isAuthenticated: !!authTokens,
    }), [user, authTokens, loading]);

    // 🔸 Ya no mostramos loader aquí: dejamos que AppContent decida.
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
