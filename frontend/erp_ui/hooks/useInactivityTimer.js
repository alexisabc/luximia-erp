// hooks/useInactivityTimer.js
'use client';
import { useEffect, useRef, useCallback } from 'react';

export function useInactivityTimer(onInactive, timeout = 5 * 60 * 1000) {
    const timerRef = useRef(null);

    const resetTimer = useCallback(() => {
        // Si el temporizador existe, lo reinicia
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        // Establece un nuevo temporizador
        timerRef.current = setTimeout(() => {
            onInactive();
        }, timeout);
    }, [onInactive, timeout]);

    useEffect(() => {
        const handleActivity = () => resetTimer();

        // Escucha eventos de actividad del usuario
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);

        // Inicia el temporizador cuando el componente se monta
        resetTimer();

        // Limpia los event listeners y el temporizador cuando el componente se desmonta
        return () => {
            clearTimeout(timerRef.current);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [resetTimer]);
}