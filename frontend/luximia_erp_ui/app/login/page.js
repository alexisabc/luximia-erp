// app/login/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Key } from 'lucide-react';

// --- Componente de Animación SVG ---
// Este componente contiene el personaje y sus animaciones CSS.
function LoginAnimation({ state, eyeTranslation }) {
    // Determinar la transformación completa de los ojos basada en el estado
    let eyesTransform = `translateX(${eyeTranslation}px)`;
    if (state === 'typing-user') {
        // Mirar MÁS hacia abajo Y seguir el cursor horizontalmente
        eyesTransform = `translateY(8px) translateX(${eyeTranslation}px)`;
    } else if (state === 'error') {
        // Solo mirar hacia abajo durante el error
        eyesTransform = 'translateY(4px)';
    } else if (state === 'peeking-pass') {
        // Centrar los ojos cuando se tapa la cara
        eyesTransform = 'translateX(0px)';
    }


    return (
        <>
            <style jsx>{`
                .svg-container, .eyes, .mouth, .eye {
                    transition: all 0.4s ease-out;
                }
                .eye {
                    transform-origin: center;
                }

                /* --- Estados de la Animación --- */

                /* Ojos cerrados al escribir contraseña */
                .typing-pass .eye {
                    transform: scaleY(0.1);
                }

                /* Animación de espiar (alternar ojos) - Más suave y lenta */
                .peeking-pass .eye-left {
                    animation: peek-a-boo-left 3s infinite ease-in-out;
                }
                .peeking-pass .eye-right {
                    animation: peek-a-boo-right 3s infinite ease-in-out;
                }
                
                /* Estado de éxito */
                .success .eye-left { transform: scaleY(0.1) translateY(40px) translateX(-5px); }
                .success .eye-right { transform: scaleY(0.1) translateY(40px) translateX(5px); }
                .success .mouth { d: path('M 40 70 Q 50 85 60 70'); stroke-width: 3; }

                /* Estado de error: sacudir la cabeza */
                .error .svg-container {
                    animation: shake 0.6s ease-in-out;
                }
                .error .mouth { 
                    d: path('M 40 75 Q 50 65 60 75');
                }
                
                /* --- Animación IDLE Simple --- */
                .idle .eye {
                    animation: simple-blink 5s infinite;
                }
                @keyframes simple-blink {
                    0%, 95%, 100% { transform: scaleY(1); }
                    97.5% { transform: scaleY(0.1); }
                }

                /* --- Animación BORED Compleja (Ciclo de 60 segundos) --- */
                .bored .eyes {
                    animation: look-around 60s infinite;
                }
                .bored .eye {
                    animation: sleepy-eyes 60s infinite;
                }
                .bored .drool-bubble {
                    animation: drool-anim 60s infinite;
                }
                .bored .zzz {
                    animation: zzz-anim 60s infinite;
                    animation-delay: calc(var(--i) * 0.2s); /* Delay para cada Z */
                }

                /* 0-30s: Mirando alrededor */
                @keyframes look-around {
                    0%, 4%, 20%, 25%, 48%, 50%, 100% { transform: translateX(0) translateY(0); }
                    5%, 9% { transform: translateX(-8px) translateY(0); }   /* Izquierda */
                    10%, 14% { transform: translateX(8px) translateY(0); }  /* Derecha */
                    15%, 19% { transform: translateY(-8px) translateX(0); } /* Arriba */
                }

                /* 0-30s: Parpadeo | 30-60s: Durmiendo */
                @keyframes sleepy-eyes {
                    0%, 23%, 27%, 48%, 100% { transform: scaleY(1); }
                    25% { transform: scaleY(0.1); } /* Parpadeo */
                    50%, 99.9% { transform: scaleY(0.1) translateY(2px); } /* Durmiendo */
                }

                /* 50-60s: Babeo */
                @keyframes drool-anim {
                    0%, 83%, 100% { transform: scale(0); opacity: 0; }
                    83.1% { transform: scale(0); opacity: 1; }
                    88% { transform: scale(1.2); } /* Se infla */
                    95% { transform: scale(1); } /* Se desinfla un poco */
                    99.9% { transform: scale(0); opacity: 1; }
                }

                /* 40-50s: Zzz */
                @keyframes zzz-anim {
                    0%, 66%, 83%, 100% { opacity: 0; transform: translate(5px, -5px) scale(0.8); }
                    66.1% { opacity: 1; transform: translate(5px, -5px) scale(1); }
                    82.9% { opacity: 0; transform: translate(15px, -40px) scale(1.5); }
                }

                /* Animación de sacudir la cabeza */
                @keyframes shake {
                    10%, 90% { transform: translateX(-2px) rotate(-3deg); }
                    20%, 80% { transform: translateX(4px) rotate(3deg); }
                    30%, 50%, 70% { transform: translateX(-6px) rotate(-3deg); }
                    40%, 60% { transform: translateX(6px) rotate(3deg); }
                }

                /* Animación de espiar más suave */
                @keyframes peek-a-boo-left {
                    0%, 20%, 90%, 100% { transform: scaleY(1); }
                    30%, 80% { transform: scaleY(0.1); }
                }
                @keyframes peek-a-boo-right {
                    0%, 20%, 90%, 100% { transform: scaleY(0.1); }
                    30%, 80% { transform: scaleY(1); }
                }
            `}</style>
            <svg viewBox="0 0 100 100" className={state}>
                <g className="svg-container">
                    {/* Cara */}
                    <circle cx="50" cy="50" r="45" fill="#e0e0e0" />

                    {/* Ojos */}
                    <g className="eyes" style={{ transform: eyesTransform }}>
                        <circle className="eye eye-left" cx="35" cy="45" r="5" fill="#333" />
                        <circle className="eye eye-right" cx="65" cy="45" r="5" fill="#333" />
                    </g>

                    {/* Boca */}
                    <path className="mouth" d="M 40 70 Q 50 75 60 70" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />

                    {/* Elementos para dormir */}
                    <g className="sleep-elements">
                        <circle className="drool-bubble" cx="42" cy="78" r="4" fill="#aedff7" style={{ transformOrigin: '42px 78px' }} />
                        <text className="zzz" x="65" y="40" fontSize="10" fill="#333" style={{ "--i": 1 }}>Z</text>
                        <text className="zzz" x="70" y="30" fontSize="12" fill="#333" style={{ "--i": 2 }}>z</text>
                        <text className="zzz" x="75" y="20" fontSize="14" fill="#333" style={{ "--i": 3 }}>z</text>
                    </g>
                </g>
            </svg>
        </>
    );
}


export default function LoginPage() {
    const { loginUser } = useAuth();
    const router = useRouter();

    // Estados del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Estado para controlar la animación SVG
    const [animationState, setAnimationState] = useState('idle');
    const [eyeTranslation, setEyeTranslation] = useState(0);
    const inactivityTimerRef = useRef(null);

    // Función para reiniciar el temporizador de inactividad
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimerRef.current);
    };

    // Función para iniciar el temporizador de inactividad
    const startInactivityTimer = () => {
        resetInactivityTimer(); // Limpia cualquier temporizador anterior
        inactivityTimerRef.current = setTimeout(() => {
            setAnimationState('bored');
        }, 5000); // 5 segundos de inactividad
    };

    // Efecto de limpieza para cuando el componente se desmonte
    useEffect(() => {
        return () => clearTimeout(inactivityTimerRef.current);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        resetInactivityTimer(); // Reinicia el temporizador al enviar
        setIsLoading(true);
        setError(null);
        try {
            await loginUser(username, password);
            setAnimationState('success');
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            setError(err.message || "El usuario o la contraseña no son válidos.");
            setAnimationState('error');
            setTimeout(() => {
                setAnimationState('idle');
                startInactivityTimer(); // Inicia el temporizador de nuevo después del error
            }, 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (field) => {
        resetInactivityTimer(); // Reinicia el temporizador al enfocar
        if (field === 'username') {
            setAnimationState('typing-user');
        } else if (field === 'password') {
            setAnimationState(showPassword ? 'peeking-pass' : 'typing-pass');
        }
    };

    const handleBlur = () => {
        setAnimationState('idle');
        setEyeTranslation(0); // Centrar los ojos cuando no hay foco
        startInactivityTimer(); // Inicia el temporizador al desenfocar
    };

    const handleUsernameChange = (e) => {
        resetInactivityTimer(); // Reinicia el temporizador al escribir
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

    const toggleShowPassword = () => {
        resetInactivityTimer(); // Reinicia el temporizador al cambiar visibilidad
        const nextShowPassword = !showPassword;
        setShowPassword(nextShowPassword);

        // Si el campo de contraseña está activo, cambia la animación inmediatamente
        if (document.activeElement.id === 'password') {
            setAnimationState(nextShowPassword ? 'peeking-pass' : 'typing-pass');
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
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => handleFocus('password')}
                                onBlur={handleBlur}
                                required
                                className="block w-full pl-10 pr-10 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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

