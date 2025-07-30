// app/login/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
// ### 1. Se importan los íconos de Heroicons ###
import { EyeIcon, EyeSlashIcon, UserIcon, KeyIcon } from '@heroicons/react/24/solid';

export default function LoginPage() {
    const { loginUser } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [loginStatus, setLoginStatus] = useState(null); // 'success' | 'error'

    const loginPlayerRef = useRef(null);

    useEffect(() => {
        const player = loginPlayerRef.current;
        if (!player) return;
        if (isInputFocused) {
            player.play();
        } else {
            player.stop();
        }
    }, [isInputFocused]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await loginUser(username, password);
            setLoginStatus('success');
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            setError(err.message || "El usuario o la contraseña no son válidos.");
            setLoginStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div

            className="relative flex items-center justify-center min-h-screen bg-gray-200 dark:bg-gray-900 overflow-hidden"
        >
            <Script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js" strategy="afterInteractive" />
            <lottie-player
                src="https://lottie.host/343e2d45-d5f8-4a5f-9162-3173cd11fee5/cbTKtp4veN.lottie"
                background="transparent"
                speed="1"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
                loop
                autoplay
            ></lottie-player>
            <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

            className="flex items-center justify-center min-h-screen bg-cover bg-center bg-gray-200 dark:bg-gray-900"
            style={{ backgroundImage: 'url(/login-bg.png)' }}
        >
            <Script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js" strategy="beforeInteractive" />
            <div className="absolute inset-0 bg-black opacity-60"></div>


            <div className="relative z-10 p-8 max-w-sm w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl dark:bg-gray-800/80 dark:border-gray-700">
                <div className="flex justify-center mb-6">
                    {loginStatus === 'success' && (
                        <lottie-player src="https://lottie.host/6297110d-74fd-4dfe-8075-eebcac7fbd43/RTKGmqA8wp.lottie" background="transparent" speed="1" style={{ width: 128, height: 128 }} autoplay></lottie-player>
                    )}
                    {loginStatus === 'error' && (
                        <lottie-player src="https://lottie.host/202b1fa9-fdab-4330-a924-0c443d0d225b/jxwreJMzoC.lottie" background="transparent" speed="1" style={{ width: 128, height: 128 }} autoplay></lottie-player>
                    )}
                    {!loginStatus && (

                        <lottie-player
                            ref={loginPlayerRef}
                            src="https://lottie.host/343e2d45-d5f8-4a5f-9162-3173cd11fee5/cbTKtp4veN.lottie"
                            background="transparent"
                            speed="1"
                            loop
                            style={{ width: 128, height: 128 }}
                        ></lottie-player>

                        isInputFocused ? (
                            <lottie-player src="https://lottie.host/343e2d45-d5f8-4a5f-9162-3173cd11fee5/cbTKtp4veN.lottie" background="transparent" speed="1" loop autoplay style={{ width: 128, height: 128 }}></lottie-player>
                        ) : (
                            <Image
                                src="/login.jpg"
                                alt="Logo Luximia ERP"
                                width={128}
                                height={128}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                                priority
                            />

                    )}
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Iniciar Sesión</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">Usuario</label>
                        {/* ### 2. Se añade ícono al campo de Usuario ### */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="username" type="text" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                required
                                className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="tu-usuario"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
                        {/* ### 3. Se actualiza el campo de Contraseña con KeyIcon y EyeIcon ### */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                required
                                className="block w-full pl-10 pr-10 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="bg-red-500/20 text-red-400 dark:text-red-300 p-3 rounded-lg text-center text-sm">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            {isLoading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}