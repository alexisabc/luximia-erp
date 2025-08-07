// context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';
import dynamic from 'next/dynamic';

const Loader = dynamic(
    () => import('../components/Loader'),
    { ssr: false }
);

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const start = Date.now();
        const tokensFromStorage = localStorage.getItem('authTokens');
        if (tokensFromStorage) {
            const parsedTokens = JSON.parse(tokensFromStorage);
            setAuthTokens(parsedTokens);
            setUser(jwtDecode(parsedTokens.access));
        }
        const elapsed = Date.now() - start;
        // Muestra el loader por un mínimo de tiempo para una mejor UX
        const timeout = setTimeout(() => setLoading(false), Math.max(0, 1500 - elapsed));
        return () => clearTimeout(timeout);
    }, []);

    // Esta es ahora la única función para establecer la sesión.
    // LoginPage la llama después de un login exitoso con Passkey o TOTP.
    const setAuthData = (data) => {
        setAuthTokens(data);
        setUser(jwtDecode(data.access));
        localStorage.setItem('authTokens', JSON.stringify(data));
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('luximia-erp-theme');
        // Redirigir al login
        window.location.href = '/login';
    };

    const hasPermission = (permissionCodename) => {
        if (user?.is_superuser) return true;
        return user?.permissions?.includes(permissionCodename);
    };

    const contextData = {
        user,
        authTokens,
        loading,
        setAuthData, // Exportamos la nueva función
        logoutUser,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <Loader className="min-h-screen" /> : children}
        </AuthContext.Provider>
    );
};