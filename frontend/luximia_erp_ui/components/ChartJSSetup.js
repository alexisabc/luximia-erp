// components/ChartJSSetup.js
'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { useEffect } from 'react';

// Registramos todos los componentes que usaremos en la aplicación
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Este componente no renderiza nada, solo se asegura de que el registro se ejecute.
export default function ChartJSSetup() {
    useEffect(() => { }, []);
    return null;
}