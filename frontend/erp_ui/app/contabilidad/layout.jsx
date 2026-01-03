'use client';
import FeatureGuard from '@/components/config/FeatureGuard';

export default function ContabilidadLayout({ children }) {
    return (
        <FeatureGuard feature="MODULE_FISCAL">
            {children}
        </FeatureGuard>
    );
}
