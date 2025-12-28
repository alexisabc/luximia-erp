'use client';

import React from 'react';
import Link from 'next/link';
import {
    Shield, Building2, Users, Database, FileText, Settings,
    Server, HardDrive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const SYSTEM_MODULES = [
    {
        title: 'Usuarios',
        description: 'Administración de cuentas y accesos',
        icon: Users,
        href: '/sistemas/usuarios',
        color: 'text-blue-600',
        bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
        title: 'Roles y Permisos',
        description: 'Configuración de niveles de autorización',
        icon: Shield,
        href: '/sistemas/roles',
        color: 'text-indigo-600',
        bg: 'bg-indigo-100 dark:bg-indigo-900/30'
    },
    {
        title: 'Empresas',
        description: 'Configuración multi-empresa y fiscal',
        icon: Building2,
        href: '/sistemas/empresas',
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
        title: 'Inventario IT',
        description: 'Control de activos tecnológicos',
        icon: HardDrive,
        href: '/sistemas/inventario',
        color: 'text-orange-600',
        bg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
        title: 'Importador de Datos',
        description: 'Carga masiva de información',
        icon: Database,
        href: '/sistemas/importar',
        color: 'text-purple-600',
        bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
        title: 'Exportador de Reportes',
        description: 'Descarga de reportes personalizados',
        icon: FileText,
        href: '/sistemas/exportar',
        color: 'text-green-600',
        bg: 'bg-green-100 dark:bg-green-900/30'
    },
    // Placeholders for future modules
    /*
    {
        title: 'Licencias',
        description: 'Gestión de licencias de software',
        icon: Key, // Import Key from lucide-react first
        href: '/sistemas/licencias',
        color: 'text-pink-600',
        bg: 'bg-pink-100 dark:bg-pink-900/30'
    }
    */
];

export default function SistemasPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    Panel de Sistemas
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Centro de administración y configuración técnica del ERP.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SYSTEM_MODULES.map((module, index) => {
                    const Icon = module.icon;
                    return (
                        <Link href={module.href} key={index} className="block group">
                            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className={`p-3 rounded-lg ${module.bg}`}>
                                        <Icon className={`w-6 h-6 ${module.color}`} />
                                    </div>
                                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                                        {module.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {module.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
