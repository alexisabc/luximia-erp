// app/login/page.js
'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, UserIcon, KeyIcon } from '@heroicons/react/24/solid';

// --- Componente de Animación SVG ---
// Este componente contiene el personaje y sus animaciones CSS.
function LoginAnimation({ state }) { // state puede ser 'idle', 'typing', 'success', 'error'
    return (
        <>
            <style jsx>{`
                .eyes {
                    transition: transform 0.3s ease-out;
                }
                .mouth {
                    transition: all 0.3s ease-out;
                }

                /* Estado por defecto (mirando al frente) */
                .typing .eyes { transform: translateX(0px); }
                
                /* Estado de éxito */
                .success .eye-right { transform: scaleY(0.1) translateY(40px); }
                .success .mouth { d: path('M 40 70 Q 50 85 60 70'); stroke-width: 3; }

                /* Estado de error */
                .error .eyes { transform: translateY(5px); }
                .error .mouth { d: path('M 40 75 Q 50 60 60 75'); stroke-width: 3; }
                
                /* Animación de parpadeo */
                @keyframes blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }
                .eye {
                    animation: blink 4s infinite;
                }
            `}</style>
            <svg viewBox="0 0 100 100" className={state}>
                {/* Cara */}
                <circle cx="50" cy="50" r="45" fill="#e0e0e0" />

                {/* Ojos */}
                <g className="eyes">
                    <circle className="eye eye-left" cx="35" cy="45" r="5" fill="#333" />
                    <circle className="eye eye-right" cx="65" cy="45" r="5" fill="#333" />
                </g>

                {/* Boca */}
                <path className="mouth" d="M 40 70 Q 50 75 60 70" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
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
    const [animationState, setAnimationState] = useState('idle'); // 'idle', 'typing', 'success', 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            // Regresar a la animación de 'typing' después de un error
            setTimeout(() => {
                setAnimationState('typing');
            }, 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = () => {
        setAnimationState('typing');
    };

    const handleBlur = () => {
        setAnimationState('idle');
    };


    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center bg-gray-200 dark:bg-gray-900"
            style={{ backgroundImage: 'url(/login-bg.png)' }}
        >
            <div className="absolute inset-0 bg-black opacity-60"></div>

            <div className="relative z-10 p-8 max-w-sm w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl dark:bg-gray-800/80 dark:border-gray-700">

                {/* Contenedor de la animación DENTRO del modal y en forma de círculo */}
                <div className="flex justify-center mb-6 h-32 w-32 mx-auto rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg bg-white">
                    <LoginAnimation state={animationState} />
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Iniciar Sesión</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">Usuario</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="username" type="text" value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
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
                                <KeyIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
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
