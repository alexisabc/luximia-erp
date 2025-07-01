// components/KpiCard.js
export default function KpiCard({ title, value, formatAsCurrency = false }) {
    const formattedValue = formatAsCurrency
        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
        : value;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formattedValue}</p>
        </div>
        );
}