import apiClient from './core';

// ### MOCK DATA FOR DASHBOARD ###
// En un futuro, estos endpoints deberían existir en el backend (ej: /api/direccion/dashboard/)

const MOCK_DASHBOARD_DATA = {
    stats: {
        totalRevenue: 12500000.00,
        revenueGrowth: 12.5, // %
        activeEmployees: 145,
        employeeGrowth: 4, // +4 this month
        activeProjects: 23,
        projectsAtRisk: 2,
        netProfit: 3420000.50,
        profitMargin: 27.3
    },
    revenueHistory: [
        { month: 'Ene', revenue: 980000, expenses: 650000 },
        { month: 'Feb', revenue: 1120000, expenses: 720000 },
        { month: 'Mar', revenue: 1050000, expenses: 680000 },
        { month: 'Abr', revenue: 1350000, expenses: 850000 },
        { month: 'May', revenue: 1450000, expenses: 880000 },
        { month: 'Jun', revenue: 1600000, expenses: 950000 },
    ],
    projectStatus: [
        { name: 'En Tiempo', value: 15, color: '#10B981' }, // green-500
        { name: 'Riesgo Bajo', value: 6, color: '#F59E0B' }, // yellow-500
        { name: 'Crítico', value: 2, color: '#EF4444' }, // red-500
    ],
    recentActivities: [
        { id: 1, type: 'ALERT', message: 'Flujo de caja por debajo del umbral seguro en Proyecto Alpha.', time: 'Hace 2 horas' },
        { id: 2, type: 'INFO', message: 'Nueva contratación de Director de Finanzas completada.', time: 'Hace 5 horas' },
        { id: 3, type: 'SUCCESS', message: 'Meta de ventas Q2 alcanzada antes de tiempo.', time: 'Ayer' },
        { id: 4, type: 'INFO', message: 'Revisión de auditoría programada para el próximo martes.', time: 'Hace 2 días' },
    ]
};

export const getDashboardData = async () => {
    // Simular delay de red
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ data: MOCK_DASHBOARD_DATA });
        }, 800);
    });
};

// Placeholder para endpoints reales futuros
export const getFinancialKpis = () => apiClient.get('/direccion/kpis/financial/');
export const getHrKpis = () => apiClient.get('/direccion/kpis/hr/');
export const getOperationalKpis = () => apiClient.get('/direccion/kpis/operations/');
