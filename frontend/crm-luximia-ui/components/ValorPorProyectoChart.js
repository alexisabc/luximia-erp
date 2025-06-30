// components/ValorPorProyectoChart.js
'use client';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Es necesario registrar los componentes que Chart.js usará
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ValorPorProyectoChart({ chartData }) {
    const data = {
        labels: chartData.map(item => item.label), // Eje X: Nombres de los proyectos
        datasets: [{
            label: 'Valor Total Contratado (MXN)',
            data: chartData.map(item => item.value), // Eje Y: Valores
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Valor Contratado por Proyecto' }
        },
        scales: {
            y: { ticks: { callback: value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value) } }
        }
    };

    return <Bar data={data} options={options} />;
}