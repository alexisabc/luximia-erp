/**
 * Página de Ejemplo - Componentes Atomic Design
 * 
 * Demuestra el uso de los nuevos componentes siguiendo
 * principios de Atomic Design y Mobile First
 */
'use client';

import React, { useState } from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import {
    KpiCard, StatCard, ActionCard, Alert, Breadcrumb,
    EmptyState, CardCustom, ActionButtonGroup
} from '@/components/molecules';
import { Avatar, Divider, Spinner, Tooltip, BadgeCustom } from '@/components/atoms';
import { Tabs } from '@/components/organisms';
import {
    DollarSign, Users, ShoppingCart, TrendingUp, FileText,
    Settings, Package, BarChart3, Home, Folder, File,
    Plus, Download, Upload, Eye, Info
} from 'lucide-react';

export default function ComponentsExamplePage() {
    const [showAlert, setShowAlert] = useState(true);

    // Datos de ejemplo
    const navItems = [
        { label: 'Dashboard', href: '/portal', icon: BarChart3 },
        {
            label: 'Ventas',
            icon: ShoppingCart,
            children: [
                { label: 'Órdenes', href: '/ventas/ordenes' },
                { label: 'Clientes', href: '/ventas/clientes' },
            ],
        },
        { label: 'Configuración', href: '/configuracion', icon: Settings },
    ];

    const user = { name: 'Juan Pérez', avatar: null };

    const breadcrumbItems = [
        { label: 'Portal', href: '/portal', icon: Home },
        { label: 'Componentes', href: '/portal/components', icon: Folder },
        { label: 'Ejemplos', icon: File },
    ];

    const tabsData = [
        {
            label: 'General',
            icon: Info,
            content: (
                <div className="space-y-4">
                    <p>Contenido de la pestaña General</p>
                    <Alert variant="info" title="Información">
                        Esta es una alerta informativa dentro de un tab.
                    </Alert>
                </div>
            ),
        },
        {
            label: 'Estadísticas',
            icon: BarChart3,
            badge: '12',
            content: (
                <div className="grid-responsive">
                    <StatCard title="Métrica 1" value="1,234" icon={TrendingUp} variant="success" />
                    <StatCard title="Métrica 2" value="5,678" icon={Users} variant="primary" />
                </div>
            ),
        },
        {
            label: 'Configuración',
            icon: Settings,
            disabled: true,
            content: <p>Contenido de configuración</p>,
        },
    ];

    return (
        <DashboardTemplate
            navItems={navItems}
            user={user}
            notificationCount={3}
            title="Componentes Atomic Design"
        >
            <div className="space-y-6 sm:space-y-8">
                {/* Breadcrumb */}
                <Breadcrumb items={breadcrumbItems} />

                {/* Alerts */}
                {showAlert && (
                    <Alert
                        variant="success"
                        title="¡Migración Completada!"
                        dismissible
                        onDismiss={() => setShowAlert(false)}
                        actionLabel="Ver Detalles"
                        onAction={() => alert('Ver detalles')}
                    >
                        Todos los componentes han sido migrados exitosamente a Atomic Design y Mobile First.
                    </Alert>
                )}

                {/* KPI Cards */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        KPI Cards (Moléculas)
                    </h2>
                    <div className="grid-responsive">
                        <KpiCard
                            title="Ventas Totales"
                            value={125000}
                            prefix="$"
                            trend={12.5}
                            icon={DollarSign}
                            variant="success"
                        />
                        <KpiCard
                            title="Clientes Activos"
                            value={1250}
                            suffix=" clientes"
                            trend={-5.2}
                            icon={Users}
                            variant="warning"
                        />
                        <KpiCard
                            title="Órdenes Pendientes"
                            value={45}
                            suffix=" órdenes"
                            icon={ShoppingCart}
                            variant="primary"
                        />
                        <KpiCard
                            title="Productos"
                            value={890}
                            trend={8.1}
                            icon={Package}
                            variant="default"
                            compact
                        />
                    </div>
                </section>

                <Divider label="Estadísticas" />

                {/* Stat Cards */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Stat Cards (Moléculas)
                    </h2>
                    <div className="grid-responsive">
                        <StatCard
                            title="Ingresos Mensuales"
                            value="$45,231"
                            icon={DollarSign}
                            change={20.1}
                            changeLabel="vs mes anterior"
                            variant="primary"
                        />
                        <StatCard
                            title="Nuevos Usuarios"
                            value="2,350"
                            icon={Users}
                            change={-5.4}
                            changeLabel="vs semana anterior"
                            variant="success"
                        />
                        <StatCard
                            title="Conversión"
                            value="3.2%"
                            icon={TrendingUp}
                            change={0.8}
                            variant="warning"
                        />
                    </div>
                </section>

                <Divider />

                {/* Action Cards */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Action Cards (Moléculas)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ActionCard
                            title="Crear Orden"
                            description="Registra una nueva orden de venta"
                            icon={ShoppingCart}
                            onClick={() => alert('Crear orden')}
                            variant="primary"
                        />
                        <ActionCard
                            title="Ver Reportes"
                            description="Accede a reportes y análisis"
                            icon={FileText}
                            onClick={() => alert('Ver reportes')}
                            variant="default"
                        />
                        <ActionCard
                            title="Configuración"
                            description="Ajusta las preferencias del sistema"
                            icon={Settings}
                            onClick={() => alert('Configuración')}
                            variant="default"
                        />
                    </div>
                </section>

                <Divider />

                {/* Action Button Group */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Action Button Group (Molécula)
                    </h2>
                    <ActionButtonGroup
                        canCreate
                        onCreate={() => alert('Crear')}
                        createLabel="Nuevo Item"
                        canImport
                        onImport={() => alert('Importar')}
                        canExport
                        onExport={() => alert('Exportar')}
                        canToggleInactive
                        onToggleInactive={() => alert('Toggle')}
                    />
                </section>

                <Divider />

                {/* Tabs */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Tabs (Organismo)
                    </h2>
                    <Tabs tabs={tabsData} variant="line" />
                </section>

                <Divider />

                {/* Cards */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Cards Personalizadas (Molécula)
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CardCustom
                            title="Card con Header"
                            description="Esta es una descripción"
                            icon={Package}
                            variant="elevated"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Contenido de la card con header, icon y descripción.
                            </p>
                        </CardCustom>
                        <CardCustom
                            variant="bordered"
                            hoverable
                            footer={
                                <div className="flex justify-end gap-2">
                                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                                        Cancelar
                                    </button>
                                    <button className="px-3 py-1 text-sm bg-primary text-white rounded">
                                        Guardar
                                    </button>
                                </div>
                            }
                        >
                            <p className="text-sm">Card con footer y efecto hover</p>
                        </CardCustom>
                    </div>
                </section>

                <Divider />

                {/* Átomos */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Átomos Básicos
                    </h2>

                    <div className="space-y-6">
                        {/* Avatares */}
                        <div>
                            <h3 className="text-base sm:text-lg font-medium mb-3">Avatares</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <Avatar size="xs" fallback="XS" />
                                <Avatar size="sm" fallback="SM" />
                                <Avatar size="md" fallback="MD" />
                                <Avatar size="lg" fallback="LG" />
                                <Avatar size="xl" fallback="XL" />
                            </div>
                        </div>

                        <Divider variant="dashed" spacing="sm" />

                        {/* Badges */}
                        <div>
                            <h3 className="text-base sm:text-lg font-medium mb-3">Badges</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <BadgeCustom variant="default">Default</BadgeCustom>
                                <BadgeCustom variant="primary">Primary</BadgeCustom>
                                <BadgeCustom variant="success" dot>Success</BadgeCustom>
                                <BadgeCustom variant="warning" icon={AlertTriangle}>Warning</BadgeCustom>
                                <BadgeCustom variant="danger" removable onRemove={() => alert('Remove')}>
                                    Removable
                                </BadgeCustom>
                            </div>
                        </div>

                        <Divider variant="dashed" spacing="sm" />

                        {/* Tooltips */}
                        <div>
                            <h3 className="text-base sm:text-lg font-medium mb-3">Tooltips</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <Tooltip content="Tooltip arriba" position="top">
                                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">
                                        Hover Top
                                    </button>
                                </Tooltip>
                                <Tooltip content="Tooltip abajo" position="bottom">
                                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">
                                        Hover Bottom
                                    </button>
                                </Tooltip>
                            </div>
                        </div>

                        <Divider variant="dashed" spacing="sm" />

                        {/* Spinners */}
                        <div>
                            <h3 className="text-base sm:text-lg font-medium mb-3">Spinners</h3>
                            <div className="flex flex-wrap items-center gap-6">
                                <Spinner size="xs" />
                                <Spinner size="sm" />
                                <Spinner size="md" />
                                <Spinner size="lg" variant="secondary" />
                                <Spinner size="xl" variant="muted" />
                            </div>
                        </div>
                    </div>
                </section>

                <Divider />

                {/* Empty State */}
                <section>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Empty States (Molécula)
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CardCustom variant="bordered">
                            <EmptyState
                                variant="search"
                                actionLabel="Limpiar Filtros"
                                onAction={() => alert('Limpiar')}
                            />
                        </CardCustom>
                        <CardCustom variant="bordered">
                            <EmptyState
                                variant="empty"
                                actionLabel="Crear Primero"
                                onAction={() => alert('Crear')}
                            />
                        </CardCustom>
                    </div>
                </section>

                <Divider label="Fin de Ejemplos" variant="dotted" />

                {/* Nota informativa */}
                <Alert variant="info" title="Nota Importante">
                    Todos estos componentes están optimizados con Mobile First
                    y siguen los principios de Atomic Design. Prueba redimensionar la ventana para
                    ver cómo se adaptan a diferentes tamaños de pantalla.
                </Alert>
            </div>
        </DashboardTemplate>
    );
}
