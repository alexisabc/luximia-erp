import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debouncing de valores.
 * @param {any} value - El valor a observar.
 * @param {number} delay - El retardo en milisegundos.
 * @returns {any} - El valor debouceado.
 */
export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
