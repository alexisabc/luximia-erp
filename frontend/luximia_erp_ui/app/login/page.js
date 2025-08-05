// app/login/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Key } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import apiClient from '../../services/api';
import LoginAnimation from '../../components/LoginAnimation';

export default function LoginPage() {
    const { completeLogin } = useAuth();
    const router = useRouter();

    // Estados del formulario
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loginMethod, setLoginMethod] = useState(null); // 'passkey' o 'totp'
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Estado para controlar la animación SVG
    const [animationState, setAnimationState] = useState('idle');
    const [eyeTranslation, setEyeTranslation] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const inactivityTimerRef = useRef(null);

    // Efecto para manejar el temporizador de inactividad
    useEffect(() => {
        // Limpiar cualquier temporizador existente cuando el estado cambie
        clearTimeout(inactivityTimerRef.current);

        // Si el estado es 'idle' Y el usuario ya ha interactuado, iniciar un temporizador para cambiar a 'bored'
        if (animationState === 'idle' && hasInteracted) {
            inactivityTimerRef.current = setTimeout(() => {
                setAnimationState('bored');
            }, 3000); // Tiempo de inactividad reducido a 3 segundos
        }

        // Función de limpieza para el desmontaje del componente
        return () => clearTimeout(inactivityTimerRef.current);
    }, [animationState, hasInteracted]);

    const markAsInteracted = () => {
        if (!hasInteracted) {
            setHasInteracted(true);
        }
    };

    const handlePasskeyLogin = async () => {
        const { data: options } = await apiClient.get('/users/passkey/login/challenge/');
        const assertion = await startAuthentication(options);
        const { data } = await apiClient.post('/users/passkey/login/verify/', { assertion });
        completeLogin(data);
        setAnimationState('success');
        setTimeout(() => router.push('/'), 2500);
    };

    const handleTotpLogin = async () => {
        const { data } = await apiClient.post('/users/totp/login/verify/', { code: otp });
        completeLogin(data);
        setAnimationState('success');
        setTimeout(() => router.push('/'), 2500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearTimeout(inactivityTimerRef.current);
        markAsInteracted();
        setIsLoading(true);
        setError(null);
        try {
            if (!loginMethod) {
                const { data } = await apiClient.post('/users/start_login/', { email });
                if (data.login_method === 'passkey') {
                    setLoginMethod('passkey');
                    setAnimationState('authenticating');
                    await handlePasskeyLogin();
                } else if (data.login_method === 'totp') {
                    setLoginMethod('totp');
                } else {
                    throw new Error('Método de inicio de sesión no soportado.');
                }
            } else if (loginMethod === 'totp') {
                await handleTotpLogin();
            }
        } catch (err) {
            setError(err.message || 'Error durante el inicio de sesión.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (field) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored' || animationState === 'error') {
            setAnimationState('idle');
        }

        // Pequeño delay para que la transición de 'bored' a 'typing' sea más suave
        setTimeout(() => {
            if (field === 'email') {
                setAnimationState('typing-user');
            } else if (field === 'otp') {
                setAnimationState('typing-otp');
            }
        }, 50);
    };

    const handleBlur = () => {
        setAnimationState('idle');
        setEyeTranslation(0); // Centrar los ojos cuando no hay foco
        startInactivityTimer();
    };

    const handleEmailChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored') setAnimationState('idle');
        setEmail(e.target.value);

        const input = e.target;
        const selection = input.selectionStart || 0;
        const MAX_CHARS_FOR_TRACKING = 10;
        const clampedSelection = Math.min(selection, MAX_CHARS_FOR_TRACKING);
        const percentage = clampedSelection / MAX_CHARS_FOR_TRACKING;
        const moveRange = 8;
        const translation = (percentage * 2 - 1) * moveRange;

        setEyeTranslation(translation);
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
            inactivityTimerRef.current = setTimeout(() => {
                setAnimationState('bored');
            }, 3000); // Tiempo de inactividad reducido a 3 segundos
        }
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {loginMethod !== 'totp' && (
                        <div>
                            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">Correo electrónico</label>
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
                            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="otp">Código de verificación</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    onFocus={() => handleFocus('otp')}
                                    onBlur={handleBlur}
                                    required
                                    className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    placeholder="123456"
                                />
                            </div>
                        </div>
                    )}

                    {error && <div className="bg-red-500/20 text-red-400 dark:text-red-300 p-3 rounded-lg text-center text-sm">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            {isLoading
                                ? 'Verificando...'
                                : loginMethod === 'totp'
                                ? 'Verificar'
                                : 'Continuar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
