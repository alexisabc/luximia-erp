import apiClient from './core';

// Re-export core client as default
export default apiClient;

// Re-export all modules
export * from './auth';
export * from './users';
export * from './accounting';
export * from './rrhh';
export * from './audit';
