'use client';

import React, { useState, useEffect } from 'react';
import { SettingSwitch } from '@/components/config/SettingSwitch';
import { SettingInput } from '@/components/config/SettingInput';
import { FeatureCard } from '@/components/config/FeatureCard';
import { useConfig } from '@/contexts/ConfigContext';

const CATEGORIES = [
    { id: 'GENERAL', name: 'General', icon: '⚙️' },
    { id: 'FISCAL', name: 'Fiscal (Contpaqi)', icon: '💰' },
    { id: 'POS', name: 'Punto de Venta (SICAR)', icon: '🛒' },
    { id: 'INVENTARIO', name: 'Inventario (Enkontrol)', icon: '📦' },
    { id: 'RRHH', name: 'Recursos Humanos', icon: '👥' },
    { id: 'SECURITY', name: 'Seguridad', icon: '🔒' },
];

export default function ConfigPanel() {
    const { refreshConfig } = useConfig();
    const [activeTab, setActiveTab] = useState('GENERAL');
    const [settings, setSettings] = useState([]);
    const [features, setFeatures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar configuraciones
    useEffect(() => {
        loadSettings();
        loadFeatures();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/core/settings/', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            setSettings(data.results || data);
        } catch (error) {
            console.error('Error cargando settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadFeatures = async () => {
        try {
            const response = await fetch('/api/core/features/', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            setFeatures(data.results || data);
        } catch (error) {
            console.error('Error cargando features:', error);
        }
    };

    // Actualizar un setting
    const updateSetting = async (id, value) => {
        const response = await fetch(`/api/core/settings/${id}/update_value/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ value }),
        });

        if (!response.ok) {
            throw new Error('Error al actualizar configuración');
        }

        // Actualizar estado local
        setSettings((prev) =>
            prev.map((s) => (s.id === id ? { ...s, value } : s))
        );

        // Refrescar contexto global
        await refreshConfig();
    };

    // Activar/desactivar feature
    const toggleFeature = async (code, isActive) => {
        const feature = features.find((f) => f.code === code);
        if (!feature) return;

        const response = await fetch(`/api/core/features/${feature.id}/toggle/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ is_active: isActive }),
        });

        if (!response.ok) {
            throw new Error('Error al cambiar feature');
        }

        // Actualizar estado local
        setFeatures((prev) =>
            prev.map((f) => (f.code === code ? { ...f, is_active: isActive } : f))
        );

        // Refrescar contexto global
        await refreshConfig();
    };

    // Filtrar settings por categoría
    const filteredSettings = settings.filter((s) => s.category === activeTab);

    // Renderizar un setting según su tipo
    const renderSetting = (setting) => {
        const { id, key, value, description } = setting;

        if (typeof value === 'boolean') {
            return (
                <SettingSwitch
                    key={id}
                    label={key.replace(/_/g, ' ')}
                    description={description}
                    value={value}
                    onChange={(newValue) => updateSetting(id, newValue)}
                />
            );
        }

        if (typeof value === 'number') {
            return (
                <SettingInput
                    key={id}
                    label={key.replace(/_/g, ' ')}
                    description={description}
                    value={value}
                    type="number"
                    onChange={(newValue) => updateSetting(id, newValue)}
                />
            );
        }

        return (
            <SettingInput
                key={id}
                label={key.replace(/_/g, ' ')}
                description={description}
                value={String(value)}
                onChange={(newValue) => updateSetting(id, newValue)}
            />
        );
    };

    if (isLoading) {
        return (
            <div className="config-panel__loading">
                <div className="spinner">⏳</div>
                <p>Cargando configuraciones...</p>
            </div>
        );
    }

    return (
        <div className="config-panel">
            <div className="config-panel__header">
                <h1 className="config-panel__title">⚙️ Panel de Configuración</h1>
                <p className="config-panel__subtitle">
                    Personaliza el comportamiento del sistema sin tocar código
                </p>
            </div>

            {/* Feature Flags */}
            <section className="config-panel__section">
                <h2 className="config-panel__section-title">🚀 Módulos del Sistema</h2>
                <div className="feature-grid">
                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.id}
                            code={feature.code}
                            name={feature.name}
                            description={feature.description}
                            isActive={feature.is_active}
                            onToggle={toggleFeature}
                        />
                    ))}
                </div>
            </section>

            {/* Tabs de Categorías */}
            <section className="config-panel__section">
                <h2 className="config-panel__section-title">🎛️ Configuraciones</h2>

                <div className="tabs">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`tab ${activeTab === cat.id ? 'tab--active' : ''}`}
                        >
                            <span className="tab__icon">{cat.icon}</span>
                            <span className="tab__name">{cat.name}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-container">
                    {filteredSettings.length === 0 ? (
                        <p className="settings-container__empty">
                            No hay configuraciones en esta categoría
                        </p>
                    ) : (
                        filteredSettings.map(renderSetting)
                    )}
                </div>
            </section>

            <style jsx>{`
        .config-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .config-panel__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .spinner {
          font-size: 3rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .config-panel__header {
          margin-bottom: 2rem;
        }

        .config-panel__title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .config-panel__subtitle {
          font-size: 1rem;
          color: #6b7280;
          margin: 0;
        }

        .config-panel__section {
          margin-bottom: 3rem;
        }

        .config-panel__section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .tab--active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .tab__icon {
          font-size: 1.25rem;
        }

        .tab__name {
          font-weight: 500;
        }

        .settings-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .settings-container__empty {
          padding: 3rem;
          text-align: center;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .config-panel {
            padding: 1rem;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .tabs {
            flex-wrap: wrap;
          }
        }
      `}</style>
        </div>
    );
}
