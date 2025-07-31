// context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';
import dynamic from 'next/dynamic'; // 1. Importa 'dynamic'

// 2. Importa el Loader dinámicamente, desactivando el SSR
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
        const timeout = setTimeout(() => setLoading(false), Math.max(0, 4000 - elapsed));
        return () => clearTimeout(timeout);
    }, []);

    const loginUser = async (username, password) => {
        try {
            const response = await apiClient.post('/token/', { username, password });
            const data = response.data;
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error("Error en el login", error);
            throw new Error(error.response?.data?.detail || "Usuario o contraseña no válidos.");
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('luximia-erp-theme');
        window.location.href = '/login';
        localStorage.removeItem('authTokens');
        localStorage.removeItem('luximia-erp-theme');
        window.location.href = '/login';
    };

    const hasPermission = (permissionCodename) => {
        if (user?.is_superuser) return true;
        return user?.permissions?.includes(permissionCodename);
    };

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {/* 3. Ahora esto funcionará sin problemas */}
            {loading ? <Loader className="min-h-screen" /> : children}
        </AuthContext.Provider>
    );
};