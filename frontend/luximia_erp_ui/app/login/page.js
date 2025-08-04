// app/login/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Key } from 'lucide-react'; // Íconos de Lucide
import LoginAnimation from '../../components/LoginAnimation'; // Importa el nuevo componente

export default function LoginPage() {
    const { loginUser } = useAuth();
    const router = useRouter();

    // Estados del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [otp, setOtp] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearTimeout(inactivityTimerRef.current);
        markAsInteracted();
        setIsLoading(true);
        setError(null);
        try {
            const result = await loginUser(username, password, mfaRequired ? otp : null);
            if (result?.mfaRequired) {
                setMfaRequired(true);
            } else if (result?.registerAuthy) {
                router.push('/authy-register');
            } else {
                setAnimationState('success');
                setTimeout(() => {
                    router.push('/');
                }, 2500);
            }
        } catch (err) {
            setError(err.message || "El usuario o la contraseña no son válidos.");
            setAnimationState('error');
            setTimeout(() => {
                setAnimationState('idle');
            }, 2000);
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
            if (field === 'username') {
                setAnimationState('typing-user');
            } else if (field === 'password') {
                setAnimationState(showPassword ? 'peeking-pass' : 'typing-pass');
            }
        }, 50);
    };

    const handleBlur = () => {
        setAnimationState('idle');
        setEyeTranslation(0); // Centrar los ojos cuando no hay foco
        startInactivityTimer();
    };

    const handleUsernameChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored') setAnimationState('idle');
        setUsername(e.target.value);

        const input = e.target;
        const selection = input.selectionStart || 0;
        const MAX_CHARS_FOR_TRACKING = 10;
        const clampedSelection = Math.min(selection, MAX_CHARS_FOR_TRACKING);
        const percentage = clampedSelection / MAX_CHARS_FOR_TRACKING;
        const moveRange = 8;
        const translation = (percentage * 2 - 1) * moveRange;

        setEyeTranslation(translation);
    };

    const handlePasswordChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored') setAnimationState('idle');
        setPassword(e.target.value);
    };

    const toggleShowPassword = () => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored') setAnimationState('idle');
        const nextShowPassword = !showPassword;
        setShowPassword(nextShowPassword);

        // Si el campo de contraseña está activo, cambia la animación inmediatamente
        if (document.activeElement.id === 'password') {
            setAnimationState(nextShowPassword ? 'peeking-pass' : 'typing-pass');
        }
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
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">Usuario</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="username" type="text" value={username}
                                onChange={handleUsernameChange}
                                onFocus={() => handleFocus('username')}
                                onBlur={handleBlur}
                                onKeyUp={handleUsernameChange}
                                onClick={handleUsernameChange}
                                required
                                className="block w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="tu-usuario"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={handlePasswordChange}
                                onFocus={() => handleFocus('password')}
                                onBlur={handleBlur}
                                required
                                className="block w-full pl-10 pr-10 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // Evita que el input pierda el foco
                                onClick={toggleShowPassword}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {mfaRequired && (
                        <div>
                            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="otp">Código de verificación</label>
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="block w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="123456"
                            />
                        </div>
                    )}

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