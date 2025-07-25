'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useResponsivePageSize(rowHeight) {
    const ref = useRef(null);
    const [pageSize, setPageSize] = useState(10);

    const calculatePageSize = useCallback(() => {
        if (ref.current) {
            const containerHeight = ref.current.clientHeight;
            const newPageSize = Math.floor(containerHeight / rowHeight);
            setPageSize(Math.max(1, newPageSize));
        }
    }, [rowHeight]);

    useEffect(() => {
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Guardamos el elemento actual del ref en una variable local.
        const element = ref.current;

        // Creamos el observador que llamará a nuestra función de cálculo.
        const resizeObserver = new ResizeObserver(calculatePageSize);

        if (element) {
            // Calculamos el tamaño inicial y empezamos a observar.
            calculatePageSize();
            resizeObserver.observe(element);
        }

        // La función de limpieza ahora usa la variable local 'element',
        // que es una referencia segura al elemento que empezamos a observar.
        return () => {
            if (element) {
                resizeObserver.unobserve(element);
            }
        };
    }, [calculatePageSize]);

    return { ref, pageSize };
}