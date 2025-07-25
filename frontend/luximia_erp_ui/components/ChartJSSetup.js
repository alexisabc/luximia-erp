// components/ChartJSSetup.js
'use client';

// ### CAMBIO CLAVE: Importamos desde 'chart.js/auto' ###
// Esto registra automáticamente todos los componentes de Chart.js
import { Chart as ChartJS } from 'chart.js/auto';
import { useEffect } from 'react';

// Este componente no renderiza nada, solo se asegura de que la importación se ejecute.
export default function ChartJSSetup() {
    useEffect(() => { }, []);
    return null;
}