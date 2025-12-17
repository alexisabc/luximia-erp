// app/(auth)/login/page.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Key, QrCode, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import apiClient from '@/services/api';
import LoginAnimation from '@/components/features/auth/LoginAnimation';

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
            setSuccessMessage('¡Cuenta activada! Inicia sesión para continuar.');
            setAnimationState('success');
            setTimeout(() => setAnimationState('idle'), 2000);
        }
    }, [search]);

    useEffect(() => {
        clearTimeout(inactivityTimerRef.current);
        if ((animationState === 'idle' || animationState === 'waiting') && hasInteracted) {
            // Timer para pasar a "waiting" (mirar a los lados) rápido
            // Timer para pasar a "bored" (dormir) después de 30s

            // Si estamos en idle, pasamos a waiting en 3s
            if (animationState === 'idle') {
                inactivityTimerRef.current = setTimeout(() => {
                    setAnimationState('waiting');
                }, 3000);
            }
            // Si estamos en waiting, pasamos a bored en 27s (total 30s desde idle)
            else if (animationState === 'waiting') {
                inactivityTimerRef.current = setTimeout(() => {
                    setAnimationState('bored');
                }, 27000);
            }
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
            if (!options?.challenge) throw new Error('Challenge inválido del servidor'); // Ajuste de robustez

            // Decodifica si es necesario, pero startAuthentication maneja JSON usualmente.
            const assertion = await startAuthentication({ optionsJSON: options });

            const { data: tokens } = await apiClient.post(passkeyVerifyEndpoint, assertion);
            setAuthData(tokens);
            setAnimationState('success');
            setTimeout(() => router.push('/'), 1200);
        } catch (err) {
            console.error(err);
            const detail = err?.response?.data?.detail;
            if (detail) setError(detail);
            else if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') setError('Cancelaste la autenticación.');
            else setError('No pudimos validar tu acceso. Intenta de nuevo.');

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
            setError(err?.response?.data?.detail || 'El código es incorrecto.');
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
        setAnimationState('authenticating'); // Breve estado de "pensando"

        try {
            const { data } = await apiClient.post(startLoginEndpoint, { email });
            if (data.available_methods?.length > 0) {
                setAvailableMethods(data.available_methods);
                setAnimationState('idle'); // Volver a idle para elegir
                // Priorizar passkey si existe
                if (data.available_methods.includes('passkey')) {
                    // Opcional: Auto-trigger passkey? Mejor dejar que el usuario elija.
                }
            } else {
                throw new Error('No tienes métodos de acceso configurados.');
            }
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Error al conectar con el servidor.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (field) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        // Si está aburrido, esperando o en error, despiértalo
        if (animationState === 'bored' || animationState === 'error' || animationState === 'waiting') setAnimationState('idle');

        // Pequeño delay para la transición natural
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

        // Si estaba dormido, esperando o idle, asegurar que pasa a modo typing
        if (animationState === 'bored' || animationState === 'idle' || animationState === 'waiting') {
            setAnimationState('typing-user');
        }

        const val = e.target.value;
        setEmail(val);

        // Tracking visual más robusto usando la longitud
        const visibleRange = 15; // Aumentar rango para que el movimiento sea más suave a lo largo de un email promedio
        const currentLen = val.length;

        // Mapear 0..visibleRange a -10..10 (coordenadas X de los ojos)
        // pct 0 = izquierda (-10px)
        // pct 0.5 = centro (0px)
        // pct 1 = derecha (10px)
        const pct = Math.min(currentLen, visibleRange) / visibleRange;
        const maxOffset = 5; // Reducido para que los ojos no se peguen al borde

        setEyeTranslation((pct * 2 - 1) * maxOffset);
    };

    const handleOtpChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored' || animationState === 'waiting') setAnimationState('idle');
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6); // Solo números
        setOtp(val);
    };

    const resetFlow = () => {
        setLoginMethod(null);
        setAvailableMethods([]);
        setEmail('');
        setError(null);
        setOtp('');
        setAnimationState('idle');
        setHasInteracted(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black transition-colors duration-500">
            {/* Background Pattern opcional */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27 opacity=%271%27/%3E%3C/svg%3E')]"></div>

            <div className="relative w-full max-w-md">
                {/* Bear Container - Floating effect */}
                <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-700 shadow-2xl bg-[#d7ccc8] flex items-center justify-center overflow-hidden transition-all duration-300">
                        <LoginAnimation state={animationState} eyeTranslation={eyeTranslation} />
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-3xl shadow-2xl pt-20 pb-8 px-8 sm:px-10 overflow-hidden relative">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Bienvenido
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Luximia ERP
                        </p>
                    </div>

                    {successMessage && (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-xl text-center text-sm mb-6 animate-in fade-in slide-in-from-top-2">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl text-center text-sm mb-6 animate-in fade-in slide-in-from-top-2 border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    {/* FASE 1: EMAIL INPUT */}
                    {availableMethods.length === 0 && loginMethod === null && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1" htmlFor="email">
                                    Correo Corporativo
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        onFocus={() => handleFocus('email')}
                                        onBlur={handleBlur}
                                        required
                                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="usuario@luximia.mx"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continuar'}
                            </button>
                        </form>
                    )}

                    {/* FASE 2: SELECT METHOD */}
                    {availableMethods.length > 0 && loginMethod === null && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 px-4 rounded-full w-fit mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                                <User className="h-4 w-4" />
                                <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>
                            </div>

                            <div className="space-y-3">
                                {availableMethods.includes('passkey') && (
                                    <button
                                        type="button"
                                        onClick={handlePasskeyLogin}
                                        disabled={isLoading}
                                        className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                <Key className="h-6 w-6" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-base font-bold text-gray-900 dark:text-white">Usar Passkey</div>
                                                <div className="text-xs text-gray-500">Más rápido y seguro</div>
                                            </div>
                                        </div>
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 text-gray-400" /> : <ArrowLeft className="h-5 w-5 rotate-180 text-gray-300 group-hover:text-blue-500 transition-colors" />}
                                    </button>
                                )}

                                {availableMethods.includes('totp') && (
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('totp')}
                                        disabled={isLoading}
                                        className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform">
                                                <QrCode className="h-6 w-6" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-base font-bold text-gray-900 dark:text-white">Código TOTP</div>
                                                <div className="text-xs text-gray-500">Google Authenticator / Authy</div>
                                            </div>
                                        </div>
                                        <ArrowLeft className="h-5 w-5 rotate-180 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={resetFlow}
                                className="w-full mt-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-sm font-medium py-2 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Usar otra cuenta
                            </button>
                        </div>
                    )}

                    {/* FASE 3: TOTP INPUT */}
                    {loginMethod === 'totp' && (
                        <form onSubmit={handleTotpLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Verificación de 2 Pasos</h3>
                                <p className="text-sm text-gray-500 mt-1">Ingresa el código de 6 dígitos</p>
                            </div>

                            <div className="flex justify-center my-6">
                                <input
                                    ref={otpInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={otp}
                                    onChange={handleOtpChange}
                                    onFocus={() => handleFocus('otp')}
                                    onBlur={handleBlur}
                                    className="block w-full text-center text-3xl font-mono tracking-[0.5em] py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-gray-800 dark:text-white placeholder-gray-300"
                                    placeholder="000000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length < 6}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verificar'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setLoginMethod(null)}
                                className="w-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-sm font-medium py-2 transition-colors"
                            >
                                Regresar
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        © 2025 Grupo Luximia. Sistema Seguro de Gestión.
                    </p>
                </div>
            </div>
        </div>
    );
}