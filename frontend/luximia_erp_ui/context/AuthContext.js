// context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedTokens = localStorage.getItem('authTokens');
                if (storedTokens) {
                    const parsedTokens = JSON.parse(storedTokens);
                    if (parsedTokens.access) return parsedTokens;
                }
            } catch (error) { return null; }
        }
        return null;
    });

    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedTokens = localStorage.getItem('authTokens');
                if (storedTokens) return jwtDecode(JSON.parse(storedTokens).access);
            } catch (error) { return null; }
        }
        return null;
    });

    const router = useRouter();

    const loginUser = async (username, password) => {
        // Leemos la URL de la API desde las variables de entorno
        const apiURL = process.env.NEXT_PUBLIC_API_URL;

        try {
            // ### CAMBIO CLAVE ###
            // Usamos la URL dinámica para la petición del token
            const response = await axios.post(`${apiURL}/token/`, {
                username,
                password
            });

            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.setItem('authTokens', JSON.stringify(data));
                router.push('/');
                return true;
            }
        } catch (error) {
            console.error("Error en el login", error);
            throw new Error(error.response?.data?.detail || "Usuario o contraseña no válidos.");
        }
    };

    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        router.push('/login');
    }, [router]);

    // --- NUEVA FUNCIÓN PARA VERIFICAR PERMISOS ---
    const hasPermission = (permissionCodename) => {
        // Si el usuario existe y su token dice que es superusuario, siempre tiene permiso.
        if (user && user.is_superuser) {
            return true;
        }

        // Si no es superusuario, revisamos la lista de permisos como antes.
        return user && user.permissions?.includes(permissionCodename);
    };

    useEffect(() => {
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                logoutUser();
            }, 15 * 60 * 1000);
        };
        if (authTokens) {
            const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => window.addEventListener(event, resetTimer));
            resetTimer();
            return () => {
                clearTimeout(inactivityTimer);
                events.forEach(event => window.removeEventListener(event, resetTimer));
            };
        }
    }, [authTokens, logoutUser]);

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        hasPermission, // <-- Exportamos la nueva función
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};