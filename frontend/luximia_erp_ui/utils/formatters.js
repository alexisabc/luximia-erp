//utils/formatters.js

export const formatCurrency = (value, currency = 'USD') => {
    // Esta línea convierte el valor a número y si es inválido (NaN), usa 0.
    const numericValue = Number(value) || 0;

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
