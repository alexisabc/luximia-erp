// app/login/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/navigation';
import { DotLottie } from '@lottiefiles/dotlottie-web';
import { EyeIcon, EyeSlashIcon, UserIcon, KeyIcon } from '@heroicons/react/24/solid';

export default function LoginPage() {
    const { loginUser } = useAuth();
    const router = useRouter();

    // Estados del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Estado para controlar la animación. Inicia en 'typing' por defecto.
    const [animationState, setAnimationState] = useState('typing'); // 'typing', 'success', 'error'

    // Referencias para el canvas y la instancia de Lottie
    const canvasRef = useRef(null);
    const lottieInstanceRef = useRef(null);

    // URLs de tus animaciones
    const animTypingURL = "https://lottie.host/343e2d45-d5f8-4a5f-9162-3173cd11fee5/cbTKtp4veN.json";
    const animSuccessURL = "https://lottie.host/6297110d-74fd-4dfe-8075-eebcac7fbd43/RTKGmqA8wp.json";
    const animErrorURL = "https://lottie.host/202b1fa9-fdab-4330-a924-0c443d0d225b/jxwreJMzoC.json";

    // Hook para inicializar y destruir la instancia de Lottie
    useEffect(() => {
        if (canvasRef.current && !lottieInstanceRef.current) {
            lottieInstanceRef.current = new DotLottie({
                canvas: canvasRef.current,
            });
        }
        return () => {
            lottieInstanceRef.current?.destroy();
            lottieInstanceRef.current = null;
        };
    }, []);

    // Hook para cambiar la animación cuando el estado cambia
    useEffect(() => {
        const lottie = lottieInstanceRef.current;
        if (!lottie) return;

        let src;
        switch (animationState) {
            case 'typing':
                src = animTypingURL;
                break;
            case 'success':
                src = animSuccessURL;
                break;
            case 'error':
                src = animErrorURL;
                break;
            default:
                return;
        }

        lottie.load({
            src,
            loop: animationState === 'typing',
            autoplay: true,
        });

    }, [animationState]);


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
            // Regresar a la animación de 'typing' después de un error para que el usuario pueda reintentar
            setTimeout(() => {
                setAnimationState('typing');
            }, 2000); // Espera 2 segundos para mostrar la animación de error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center bg-gray-200 dark:bg-gray-900"
            style={{ backgroundImage: 'url(/login-bg.png)' }}
        >
            <div className="absolute inset-0 bg-black opacity-60"></div>

            <div className="relative z-10 pt-24 pb-8 px-8 max-w-sm w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl dark:bg-gray-800/80 dark:border-gray-700">

                {/* Contenedor de la animación posicionado en la parte superior */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48">
                    <canvas
                        ref={canvasRef}
                        style={{ width: '100%', height: '100%' }}
                    />
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
                                onFocus={() => setAnimationState('typing')}
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
                                onFocus={() => setAnimationState('typing')}
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