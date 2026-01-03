'use client';

import React, { useState } from 'react';

interface FeatureCardProps {
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    onToggle: (code: string, isActive: boolean) => Promise<void>;
    icon?: string;
}

export function FeatureCard({
    code,
    name,
    description,
    isActive,
    onToggle,
    icon = '🚀',
}: FeatureCardProps) {
    const [isOptimistic, setIsOptimistic] = useState(isActive);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async () => {
        if (isLoading) return;

        const previousValue = isOptimistic;
        const newValue = !isOptimistic;

        // Optimistic UI
        setIsOptimistic(newValue);
        setIsLoading(true);
        setError(null);

        try {
            await onToggle(code, newValue);
        } catch (err) {
            // Revertir en caso de error
            setIsOptimistic(previousValue);
            setError(err instanceof Error ? err.message : 'Error al cambiar módulo');
            console.error('Error al cambiar feature:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`feature-card ${isOptimistic ? 'feature-card--active' : ''}`}>
            <div className="feature-card__icon">{icon}</div>

            <div className="feature-card__content">
                <h3 className="feature-card__title">{name}</h3>
                <p className="feature-card__description">{description}</p>
                <code className="feature-card__code">{code}</code>
                {error && <p className="feature-card__error">{error}</p>}
            </div>

            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`feature-card__toggle ${isOptimistic ? 'feature-card__toggle--active' : ''
                    }`}
            >
                {isLoading ? (
                    <span className="feature-card__spinner">⏳</span>
                ) : isOptimistic ? (
                    '✅ Activo'
                ) : (
                    '❌ Inactivo'
                )}
            </button>

            <style jsx>{`
        .feature-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          transition: all 0.3s;
        }

        .feature-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .feature-card--active {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
        }

        .feature-card__icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .feature-card__content {
          flex: 1;
        }

        .feature-card__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .feature-card__description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 0.5rem 0;
        }

        .feature-card__code {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: #f3f4f6;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #4b5563;
          font-family: 'Courier New', monospace;
        }

        .feature-card__error {
          font-size: 0.875rem;
          color: #dc2626;
          margin: 0.5rem 0 0 0;
        }

        .feature-card__toggle {
          padding: 0.5rem 1.5rem;
          border: 2px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .feature-card__toggle:hover:not(:disabled) {
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .feature-card__toggle--active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .feature-card__toggle--active:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }

        .feature-card__toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .feature-card__spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
        </div>
    );
}
