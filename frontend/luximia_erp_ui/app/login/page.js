// app/login/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Key } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import apiClient from '../../services/api';
import LoginAnimation from '../../components/LoginAnimation';

export default function LoginPage() {
    const { setAuthData } = useAuth();
    const router = useRouter();
    const search = useSearchParams();

    // Estados del formulario
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loginMethod, setLoginMethod] = useState(null); // 'passkey' | 'totp'
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Animación
    const [animationState, setAnimationState] = useState('idle');
    const [eyeTranslation, setEyeTranslation] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const inactivityTimerRef = useRef(null);

    //Activación exitosa
    const [successMessage, setSuccessMessage] = useState('');

    // Mensaje post-enrollment (opcional)
    useEffect(() => {
        if (search?.get('enrolled') === 'true') {
            // feedback suave, sin meter otro estado
            setError(null);
        }
    }, [search]);

    // Inactividad → bored
    useEffect(() => {
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'idle' && hasInteracted) {
            inactivityTimerRef.current = setTimeout(() => {
                setAnimationState('bored');
            }, 3000);
        }
        return () => clearTimeout(inactivityTimerRef.current);
    }, [animationState, hasInteracted]);

    const markAsInteracted = () => {
        if (!hasInteracted) setHasInteracted(true);
    };

    // ====== ENDPOINTS alineados al backend ======
    const startLoginEndpoint = '/users/login/start/';
    const passkeyChallengeEndpoint = '/users/passkey/login/challenge/';
    const passkeyVerifyEndpoint = '/users/passkey/login/';              // <- ojo: no /verify/
    const totpVerifyEndpoint = '/users/totp/login/verify/';

    // PASSKEY
    const handlePasskeyLogin = async () => {
        setIsLoading(true);
        setError(null);
        setAnimationState('authenticating');
        try {
            // 1) Challenge
            const { data: options } = await apiClient.get(passkeyChallengeEndpoint);
            if (!options?.challenge) throw new Error('Challenge inválido del servidor');

            // 2) WebAuthn
            const assertion = await startAuthentication({ optionsJSON: options });

            // 3) Verificar en backend y obtener tokens
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

    // TOTP
    const handleTotpLogin = async () => {
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

    // SUBMIT: inicia el flujo
    const handleSubmit = async (e) => {
        e.preventDefault();
        clearTimeout(inactivityTimerRef.current);
        markAsInteracted();
        setIsLoading(true);
        setError(null);

        try {
            if (!loginMethod) {
                // 1) Iniciar login → backend decide método
                const { data } = await apiClient.post(startLoginEndpoint, { email });
                if (data.login_method === 'passkey') {
                    setLoginMethod('passkey');
                    await handlePasskeyLogin(); // disparamos inmediatamente
                } else if (data.login_method === 'totp') {
                    setLoginMethod('totp'); // mostramos campo OTP
                    setAnimationState('idle');
                } else {
                    throw new Error('Método de inicio de sesión no soportado.');
                }
            } else if (loginMethod === 'totp') {
                await handleTotpLogin();
            }
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Error durante el inicio de sesión.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 1400);
        } finally {
            setIsLoading(false);
        }
    };

    // Animación: foco/tecleo
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

    const startInactivityTimer = () => {
        clearTimeout(inactivityTimerRef.current);
        if (hasInteracted) {
            inactivityTimerRef.current = setTimeout(() => setAnimationState('bored'), 3000);
        }
    };


    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('enrolled') === 'true') {
            setError(null);
            // Opcional: mostrar mensaje de éxito
            setSuccessMessage('Cuenta activada correctamente, por favor inicia sesión.');
        }
    }, [searchParams]);


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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {loginMethod !== 'totp' && (
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
                                    onKeyUp={handleEmailChange}
                                    onClick={handleEmailChange}
                                    required
                                    className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>
                    )}

                    {loginMethod === 'totp' && (
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
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={handleOtpChange}
                                    onFocus={() => handleFocus('otp')}
                                    onBlur={handleBlur}
                                    required
                                    className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-center tracking-widest"
                                    placeholder="123456"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 text-red-400 dark:text-red-300 p-3 rounded-lg text-center text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            {isLoading ? 'Verificando...' : loginMethod === 'totp' ? 'Verificar' : 'Continuar'}
                        </button>

                        {loginMethod === 'passkey' && (
                            <button
                                type="button"
                                onClick={handlePasskeyLogin}
                                disabled={isLoading}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
                            >
                                Reintentar passkey
                            </button>
                        )}

                        {loginMethod === 'totp' && (
                            <button
                                type="button"
                                onClick={() => setLoginMethod(null)}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cambiar email
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
