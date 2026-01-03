'use client';
import FeatureGuard from '@/components/config/FeatureGuard';

export default function RRHHLayout({ children }) {
    return (
        <FeatureGuard feature="MODULE_RRHH">
            {children}
        </FeatureGuard>
    );
}
