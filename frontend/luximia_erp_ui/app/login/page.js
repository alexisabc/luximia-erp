// app/login/page.js
'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';

// ### NUEVO: Íconos para el ojo ###
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.126 2.453.36m6.427 6.427A10.016 10.016 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7a10.016 10.016 0 01-1.453-.133M3 3l18 18" />
    </svg>
);


export default function LoginPage() {
    const { loginUser } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // <-- 1. Nuevo estado para controlar la visibilidad

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await loginUser(username, password);
        } catch (err) {
            setError(err.message || "El usuario o la contraseña no son válidos.");
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{ backgroundImage: 'url(/login-bg.png)' }}
        >
            <div className="absolute inset-0 bg-black opacity-60"></div>

            <div className="relative z-10 p-8 max-w-sm w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <Image
                        src="/login.jpg"
                        alt="Logo Luximia ERP"
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        priority
                    />
                </div>

                <h2 className="text-2xl font-bold text-center text-white mb-6">Luximia ERP</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">Usuario</label>
                        <input
                            id="username" type="text" value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="block w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* --- SECCIÓN DE CONTRASEÑA MODIFICADA --- */}
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
                        {/* 2. Contenedor con posición relativa para el ícono */}
                        <div className="relative">
                            <input
                                id="password"
                                // 3. El tipo del input ahora es dinámico
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                // Se añade padding a la derecha (pr-10) para hacer espacio al ícono
                                className="block w-full px-4 py-2 pr-10 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {/* 4. El botón con el ícono del ojo */}
                            <button
                                type="button" // Importante para que no envíe el formulario
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center text-sm">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500"
                        >
                            {isLoading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}