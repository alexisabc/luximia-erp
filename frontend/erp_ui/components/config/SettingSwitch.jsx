'use client';

import React, { useState } from 'react';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.description]
 * @param {boolean} props.value
 * @param {function} props.onChange
 * @param {boolean} [props.disabled]
 */
export function SettingSwitch({
    label,
    description,
    value,
    onChange,
    disabled = false,
}) {
    const [isOptimistic, setIsOptimistic] = useState(value);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleToggle = async () => {
        if (disabled || isLoading) return;

        const previousValue = isOptimistic;
        const newValue = !isOptimistic;

        // Optimistic UI: Cambiar inmediatamente
        setIsOptimistic(newValue);
        setIsLoading(true);
        setError(null);

        try {
            await onChange(newValue);
            // Éxito: el valor optimista ya está aplicado
        } catch (err) {
            // Error: Revertir al valor anterior
            setIsOptimistic(previousValue);
            setError(err instanceof Error ? err.message : 'Error al guardar');
            console.error('Error al cambiar configuración:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="setting-switch">
            <div className="setting-switch__content">
                <div className="setting-switch__info">
                    <label className="setting-switch__label">{label}</label>
                    {description && (
                        <p className="setting-switch__description">{description}</p>
                    )}
                    {error && <p className="setting-switch__error">{error}</p>}
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={isOptimistic}
                    disabled={disabled || isLoading}
                    onClick={handleToggle}
                    className={`toggle ${isOptimistic ? 'toggle--active' : ''} ${isLoading ? 'toggle--loading' : ''
                        }`}
                >
                    <span className="toggle__slider" />
                </button>
            </div>

            <style jsx>{`
        .setting-switch {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .setting-switch__content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .setting-switch__info {
          flex: 1;
        }

        .setting-switch__label {
          display: block;
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .setting-switch__description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .setting-switch__error {
          font-size: 0.875rem;
          color: #dc2626;
          margin: 0.25rem 0 0 0;
        }

        .toggle {
          position: relative;
          width: 3rem;
          height: 1.75rem;
          background-color: #d1d5db;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          flex-shrink: 0;
        }

        .toggle:hover:not(:disabled) {
          background-color: #9ca3af;
        }

        .toggle--active {
          background-color: #3b82f6;
        }

        .toggle--active:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle--loading {
          opacity: 0.7;
        }

        .toggle__slider {
          position: absolute;
          top: 0.125rem;
          left: 0.125rem;
          width: 1.5rem;
          height: 1.5rem;
          background-color: white;
          border-radius: 9999px;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .toggle--active .toggle__slider {
          transform: translateX(1.25rem);
        }
      `}</style>
        </div>
    );
}
