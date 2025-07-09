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
        const apiURL = process.env.NEXT_PUBLIC_API_URL;
        try {
            const response = await axios.post(`${apiURL}/token/`, { username, password });
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

    // ### INICIO DE LA SECCIÓN CORREGIDA ###

    // Envolvemos logoutUser en useCallback para asegurar que su referencia es estable.
    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        router.push('/login');
    }, [router]);

    // Usamos useCallback para estabilizar también la función que resetea el timer.
    const resetInactivityTimer = useCallback(() => {
        // La lógica del timer se mueve adentro de esta función memoizada.
        let inactivityTimer;

        const reset = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                // Llama a logoutUser después de 15 minutos de inactividad.
                logoutUser();
            }, 15 * 60 * 1000);
        };

        // Escuchamos los eventos de actividad del usuario.
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, reset));

        reset(); // Inicia el timer por primera vez.

        // Esta función de limpieza se ejecutará cuando el componente se desmonte
        // o cuando las dependencias del useEffect cambien.
        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => window.removeEventListener(event, reset));
        };
    }, [logoutUser]); // La función solo se recreará si logoutUser cambia.

    useEffect(() => {
        // Si el usuario está logueado, activamos el timer de inactividad.
        if (authTokens) {
            // Llamamos a la función que configura todo.
            // La función que retorna se encargará de la limpieza.
            return resetInactivityTimer();
        }
    }, [authTokens, resetInactivityTimer]);

    // ### FIN DE LA SECCIÓN CORREGIDA ###

    const hasPermission = (permissionCodename) => {
        if (user && user.is_superuser) {
            return true;
        }
        return user && user.permissions?.includes(permissionCodename);
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
            {children}
        </AuthContext.Provider>
    );
};