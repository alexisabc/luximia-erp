'use client';

import React, { useState, useEffect } from 'react';

interface SettingInputProps {
    label: string;
    description?: string;
    value: string | number;
    type?: 'text' | 'number' | 'email';
    onChange: (value: string | number) => Promise<void>;
    disabled?: boolean;
    min?: number;
    max?: number;
    placeholder?: string;
}

export function SettingInput({
    label,
    description,
    value,
    type = 'text',
    onChange,
    disabled = false,
    min,
    max,
    placeholder,
}: SettingInputProps) {
    const [localValue, setLocalValue] = useState(value);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalValue(value);
        setHasChanges(false);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setLocalValue(newValue);
        setHasChanges(true);
        setError(null);
    };

    const handleSave = async () => {
        if (!hasChanges || disabled || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            await onChange(localValue);
            setHasChanges(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
            console.error('Error al guardar configuración:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setLocalValue(value);
            setHasChanges(false);
            setError(null);
        }
    };

    return (
        <div className="setting-input">
            <div className="setting-input__header">
                <label className="setting-input__label">{label}</label>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="setting-input__save-btn"
                    >
                        {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                )}
            </div>

            {description && (
                <p className="setting-input__description">{description}</p>
            )}

            <input
                type={type}
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled || isLoading}
                min={min}
                max={max}
                placeholder={placeholder}
                className="setting-input__field"
            />

            {error && <p className="setting-input__error">{error}</p>}

            <style jsx>{`
        .setting-input {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .setting-input__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .setting-input__label {
          font-weight: 500;
          color: #111827;
        }

        .setting-input__save-btn {
          padding: 0.25rem 0.75rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .setting-input__save-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .setting-input__save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .setting-input__description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 0.5rem 0;
        }

        .setting-input__field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .setting-input__field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .setting-input__field:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .setting-input__error {
          font-size: 0.875rem;
          color: #dc2626;
          margin: 0.5rem 0 0 0;
        }
      `}</style>
        </div>
    );
}
