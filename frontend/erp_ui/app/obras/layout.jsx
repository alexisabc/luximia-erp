'use client';
import FeatureGuard from '@/components/config/FeatureGuard';

export default function ObrasLayout({ children }) {
    return (
        <FeatureGuard feature="MODULE_OBRAS">
            {children}
        </FeatureGuard>
    );
}
