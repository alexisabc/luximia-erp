//utils/formatters.js
export const formatCurrency = (value, currency = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(value);
};
