'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad
const WARNING_MS = 60 * 1000;      // Mostrar alerta 1 minuto antes

export default function SessionTimeout() {
    const { logoutUser, isAuthenticated } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);

    // Referencias para timers y control
    const idleTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Reiniciar timers
    const resetTimer = useCallback(() => {
        if (!isAuthenticated) return;

        lastActivityRef.current = Date.now();

        if (showWarning) {
            setShowWarning(false);
        }

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) clearInterval(warningTimerRef.current);

        // Timer principal para mostrar la advertencia
        idleTimerRef.current = setTimeout(() => {
            setShowWarning(true);

            // Iniciar cuenta regresiva interna para el logout forzado
            let countdown = 60;
            setTimeLeft(countdown);

            warningTimerRef.current = setInterval(() => {
                countdown -= 1;
                setTimeLeft(countdown);
                if (countdown <= 0) {
                    clearInterval(warningTimerRef.current);
                    logoutUser();
                }
            }, 1000);

        }, TIMEOUT_MS - WARNING_MS);

    }, [isAuthenticated, logoutUser, showWarning]);

    // Throttle para eventos de actividad (no ejecutar en cada pixel movido)
    const handleActivity = useCallback(() => {
        // Solo resetear si ha pasado 1 segundo desde la última actividad registrada
        // para evitar spam de reseteos
        if (Date.now() - lastActivityRef.current > 1000) {
            resetTimer();
        }
    }, [resetTimer]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        // Agregar listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Iniciar timer inicial
        resetTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (warningTimerRef.current) clearInterval(warningTimerRef.current);
        };
    }, [isAuthenticated, handleActivity, resetTimer]);

    // Si no hay advertencia, no renderizar nada (logica invisible)
    if (!showWarning || !isAuthenticated) return null;

    // Renderizar modal en Portal para asegurar que encime todo
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800 text-center relative overflow-hidden">
                {/* Barra de progreso superior */}
                <div className="absolute top-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 60) * 100}%` }} />

                <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    ¿Sigues ahí?
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Tu sesión expirará en <span className="font-bold text-red-600 dark:text-red-400">{timeLeft} segundos</span> por inactividad.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={resetTimer}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Continuar Trabajando
                    </button>
                    <button
                        onClick={logoutUser}
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
