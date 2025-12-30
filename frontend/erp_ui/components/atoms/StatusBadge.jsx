import React from 'react';

const STATUS_COLORS = {
    BORRADOR: 'bg-gray-100 text-gray-800 border-gray-200',
    CALCULADA: 'bg-blue-100 text-blue-800 border-blue-200',
    TIMBRADA: 'bg-green-100 text-green-800 border-green-200',
    CANCELADA: 'bg-red-100 text-red-800 border-red-200',
};

export const StatusBadge = ({ status }) => {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
            {status}
        </span>
    );
};
