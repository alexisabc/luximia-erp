// frontend/luximia_erp_ui/utils/formatters.js

export const formatCurrency = (value, currency = 'USD') => {
    // 1. Convertimos el valor a un número y manejamos casos nulos o inválidos.
    const numericValue = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(numericValue)) {
        // Si el valor no es un número válido, devolvemos un formato por defecto.
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(0);
    }

    // 2. Usamos Intl.NumberFormat para formatear la moneda.
    // 'es-MX' se encarga de usar el formato de México (coma para miles, punto para decimales).
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericValue);
  };