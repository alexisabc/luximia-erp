export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Sistema ERP';
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Mi Empresa';
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || null;

// Helper to get initials or monogram
export const getMonogram = (name = APP_NAME) => {
    return name ? name[0].toUpperCase() : 'E';
};
