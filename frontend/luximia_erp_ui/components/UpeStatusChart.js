// frontend/luximia_erp_ui/components/UpeStatusChart.js
'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function UpeStatusChart({ chartData }) {
    if (!chartData || !chartData.labels || !chartData.values) {
        return <p>No hay datos disponibles para la gráfica.</p>;
    }

    const data = {
        labels: chartData.labels,
        datasets: [{
            label: '# de UPEs',
            data: chartData.values,
            backgroundColor: [
                'rgba(54, 162, 235, 0.7)', // Azul (Disponible)
                'rgba(255, 99, 132, 0.7)', // Rojo (Vendida)
                'rgba(75, 192, 192, 0.7)', // Verde (Pagada)
                'rgba(255, 206, 86, 0.7)', // Amarillo (Bloqueada)
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Distribución de Estado de UPEs',
            },
        },
    };

    return <Doughnut data={data} options={options} />;
}