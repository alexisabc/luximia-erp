// context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const tokensFromStorage = localStorage.getItem('authTokens');
        if (tokensFromStorage) {
            const parsedTokens = JSON.parse(tokensFromStorage);
            setAuthTokens(parsedTokens);
            setUser(jwtDecode(parsedTokens.access));
        }
        setLoading(false);
    }, []);

    const loginUser = async (username, password) => {
        try {
            const response = await apiClient.post('/token/', { username, password });
            const data = response.data;
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
            router.push('/');
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
            {loading ? null : children}
        </AuthContext.Provider>
    );
};