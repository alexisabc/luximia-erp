// app/(autenticacion)/login/page.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Key, QrCode } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import apiClient from '@/services/api';
import LoginAnimation from '@/components/ui/LoginAnimation';

export default function LoginPage() {
    const { setAuthData } = useAuth();
    const router = useRouter();
    const search = useSearchParams();

    // Estados del formulario
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loginMethod, setLoginMethod] = useState(null); // 'passkey' | 'totp' | null
    const [availableMethods, setAvailableMethods] = useState([]); // Métodos disponibles para el usuario
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Animación
    const [animationState, setAnimationState] = useState('idle');
    const [eyeTranslation, setEyeTranslation] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const inactivityTimerRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');

    const otpInputRef = useRef(null);

    useEffect(() => {
        if (search?.get('enrolled') === 'true') {
            setError(null);
            setSuccessMessage('Cuenta activada correctamente, por favor inicia sesión.');
        }
    }, [search]);

    useEffect(() => {
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'idle' && hasInteracted) {
            inactivityTimerRef.current = setTimeout(() => {
                setAnimationState('bored');
            }, 3000);
        }
        return () => clearTimeout(inactivityTimerRef.current);
    }, [animationState, hasInteracted]);

    useEffect(() => {
        if (loginMethod === 'totp' && otpInputRef.current) {
            otpInputRef.current.focus();
        }
    }, [loginMethod]);

    const markAsInteracted = () => {
        if (!hasInteracted) setHasInteracted(true);
    };

    const startInactivityTimer = () => {
        clearTimeout(inactivityTimerRef.current);
        if (hasInteracted) {
            inactivityTimerRef.current = setTimeout(() => setAnimationState('bored'), 3000);
        }
    };

    const startLoginEndpoint = '/users/login/start/';
    const passkeyChallengeEndpoint = '/users/passkey/login/challenge/';
    const passkeyVerifyEndpoint = '/users/passkey/login/';
    const totpVerifyEndpoint = '/users/totp/login/verify/';

    const handlePasskeyLogin = async () => {
        setIsLoading(true);
        setError(null);
        setAnimationState('authenticating');
        try {
            const { data: options } = await apiClient.get(passkeyChallengeEndpoint);
            if (!options?.challenge) throw new Error('Challenge inválido del servidor');
            const assertion = await startAuthentication({ optionsJSON: options });
            const { data: tokens } = await apiClient.post(passkeyVerifyEndpoint, assertion);
            setAuthData(tokens);
            setAnimationState('success');
            setTimeout(() => router.push('/'), 1200);
        } catch (err) {
            const detail = err?.response?.data?.detail;
            if (detail) setError(detail);
            else if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') setError('Autenticación cancelada.');
            else setError('Fallo en autenticación con passkey.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 1400);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTotpLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAnimationState('authenticating');
        try {
            const { data: tokens } = await apiClient.post(totpVerifyEndpoint, { code: otp });
            setAuthData(tokens);
            setAnimationState('success');
            setTimeout(() => router.push('/'), 1200);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Código TOTP inválido.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 1400);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.post(startLoginEndpoint, { email });
            if (data.available_methods?.length > 0) {
                setAvailableMethods(data.available_methods);
            } else {
                throw new Error('No hay métodos de login disponibles.');
            }
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Error durante el inicio de sesión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (field) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored' || animationState === 'error') setAnimationState('idle');
        setTimeout(() => {
            if (field === 'email') setAnimationState('typing-user');
            if (field === 'otp') setAnimationState('typing-otp');
        }, 50);
    };

    const handleBlur = () => {
        setAnimationState('idle');
        setEyeTranslation(0);
        startInactivityTimer();
    };

    const handleEmailChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored') setAnimationState('idle');
        setEmail(e.target.value);
        const input = e.target;
        const selection = input.selectionStart || 0;
        const MAX = 10;
        const pct = Math.min(selection, MAX) / MAX;
        const moveRange = 8;
        setEyeTranslation((pct * 2 - 1) * moveRange);
    };

    const handleOtpChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored') setAnimationState('idle');
        setOtp(e.target.value);
    };

    const handleBackToEmail = () => {
        setLoginMethod(null);
        setAvailableMethods([]);
        setEmail('');
        setError(null);
    };

    const handleBackToMethodSelection = () => {
        setLoginMethod(null);
        setError(null);
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center bg-gray-200 dark:bg-gray-900"
            style={{ backgroundImage: 'url(/login-bg.png)' }}
        >
            <div className="absolute inset-0 bg-black opacity-60"></div>

            <div className="relative z-10 p-8 max-w-sm w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl dark:bg-gray-800/80 dark:border-gray-700">
                <div className="flex justify-center mb-6 h-32 w-32 mx-auto rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg bg-white">
                    <LoginAnimation state={animationState} eyeTranslation={eyeTranslation} />
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Iniciar Sesión</h2>

                {successMessage && (
                    <div className="bg-green-500/20 text-green-300 p-3 rounded-lg text-center text-sm mb-3">
                        {successMessage}
                    </div>
                )}

                {/* Sección 1: Ingreso de email */}
                {availableMethods.length === 0 && loginMethod === null && (
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    onFocus={() => handleFocus('email')}
                                    onBlur={handleBlur}
                                    required
                                    className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            {isLoading ? 'Verificando...' : 'Continuar'}
                        </button>
                    </form>
                )}

                {/* Sección 2: Selección de método de autenticación */}
                {availableMethods.length > 0 && loginMethod === null && (
                    <div className="space-y-3">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                            ¿Cómo deseas iniciar sesión con **{email}**?
                        </p>
                        <div className="space-y-3">
                            {availableMethods.includes('passkey') && (
                                <button
                                    type="button"
                                    onClick={handlePasskeyLogin}
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                                >
                                    <Key className="h-5 w-5" />
                                    <span>Continuar con Passkey</span>
                                </button>
                            )}
                            {availableMethods.includes('totp') && (
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod('totp')}
                                    disabled={isLoading}
                                    className="w-full bg-gray-700 hover:bg-gray-600 transition-colors text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:bg-gray-500 dark:disabled:bg-gray-700"
                                >
                                    <QrCode className="h-5 w-5" />
                                    <span>Continuar con TOTP</span>
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleBackToEmail}
                            className="w-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 px-4 py-2 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                        >
                            Cambiar email
                        </button>
                    </div>
                )}

                {/* Sección 3: Autenticación con TOTP */}
                {loginMethod === 'totp' && (
                    <form onSubmit={handleTotpLogin} className="space-y-6">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            Por favor, ingresa el código de verificación para **{email}**.
                        </p>
                        <div>
                            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="otp">
                                Código de verificación
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="otp"
                                    ref={otpInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => {
                                        handleOtpChange(e);
                                        handleFocus('otp');
                                    }}
                                    onBlur={handleBlur}
                                    required
                                    className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-center tracking-widest"
                                    placeholder="123456"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600">
                                {isLoading ? 'Verificando...' : 'Verificar'}
                            </button>
                            <button
                                type="button"
                                onClick={handleBackToMethodSelection}
                                className="w-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 px-4 py-2 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                            >
                                Regresar
                            </button>
                        </div>
                    </form>
                )}

                {/* Sección 4: Autenticación con Passkey */}
                {loginMethod === 'passkey' && (
                    <div className="space-y-3">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            Por favor, usa tu passkey para **{email}**.
                        </p>
                        <button
                            type="button"
                            onClick={handlePasskeyLogin}
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            <Key className="h-5 w-5" />
                            <span>Reintentar passkey</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleBackToMethodSelection}
                            className="w-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 px-4 py-2 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                        >
                            Regresar
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 text-red-400 dark:text-red-300 p-3 rounded-lg text-center text-sm mt-3">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}