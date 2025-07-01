// app/login/page.js
'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image'; // Importamos el componente de Imagen de Next.js

export default function LoginPage() {
    const { loginUser } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await loginUser(username, password);
        } catch (err) {
            setError("El usuario o la contraseña no son válidos.");
            setIsLoading(false);
        }
    };

    return (
        // Contenedor principal con la imagen de fondo
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{ backgroundImage: 'url(/login-bg.jpg)' }}
        >
            {/* Capa semitransparente para oscurecer el fondo y mejorar la legibilidad */}
            <div className="absolute inset-0 bg-black opacity-50"></div>

            {/* Contenedor del formulario, se posiciona sobre las capas de fondo */}
            <div className="relative z-10 p-8 max-w-sm w-full bg-white rounded-xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <Image
                        src="/login.jpg"
                        alt="Logo Grupo Luximia"
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        priority // Carga la imagen con prioridad
                    />
                </div>

                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Usuario</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                            id="username" type="text" value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                            id="password" type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* --- ZONA PARA MOSTRAR EL ERROR --- */}
                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            // Quitamos bg-luximia-orange y su hover, y ponemos las nuestras
                            className="bg-luximia-brand-orange hover:bg-luximia-brand-orange-dark transition-colors text-white font-bold py-2 px-4 rounded w-full disabled:bg-gray-400"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}