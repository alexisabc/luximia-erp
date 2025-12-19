'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook para calcular dinámicamente cuántas filas caben en un contenedor.
 * Utiliza ResizeObserver para reaccionar a cambios en el tamaño del contenedor específico.
 * 
 * @param {number} rowHeight - Altura estimada de cada fila en píxeles (default: 50).
 * @param {number} minPageSize - Mínimo número de registros a mostrar (default: 5).
 * @returns {object} { ref, pageSize }
 */
export function useResponsivePageSize(rowHeight = 50, minPageSize = 5) {
    const ref = useRef(null);
    const [pageSize, setPageSize] = useState(10);

    // Debounce para evitar renders excesivos durante redimensionamiento rápido
    const timeoutRef = useRef(null);

    const updatePageSize = useCallback((entries) => {
        if (!Array.isArray(entries) || !entries.length) return;

        const entry = entries[0];
        // Usamos contentRect para obtener la altura exacta disponible del contenido
        const height = entry.contentRect.height;

        if (height > 0) {
            // Cancelar update pendiente anterior
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // Pequeño delay (debounce) para suavidad
            timeoutRef.current = setTimeout(() => {
                const newPageSize = Math.floor(height / rowHeight);
                // Aseguramos un mínimo razonable para no romper la UI
                setPageSize(Math.max(minPageSize, newPageSize));
            }, 50);
        }
    }, [rowHeight, minPageSize]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver(updatePageSize);
        resizeObserver.observe(element);

        // Cálculo inicial inmediato si ya hay dimensiones
        if (element.clientHeight) {
            const newPageSize = Math.floor(element.clientHeight / rowHeight);
            setPageSize(Math.max(minPageSize, newPageSize));
        }

        return () => {
            resizeObserver.disconnect();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [updatePageSize, rowHeight, minPageSize]);

    return { ref, pageSize };
}