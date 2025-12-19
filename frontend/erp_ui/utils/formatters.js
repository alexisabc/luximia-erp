// utils/formatters.js

export const formatCurrency = (value, currency = 'USD') => {
    // Si el valor no es un número válido, devuelve una cadena de texto predeterminada.
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
        return 'N/A'; // O cualquier otro valor que quieras mostrar
    }

    try {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericValue);
    } catch (error) {
        // Fallback por si la 'currency' es inválida
        console.error("Error al formatear moneda:", error);
        return `$${numericValue.toFixed(2)}`;
    }
};