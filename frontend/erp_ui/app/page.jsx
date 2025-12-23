'use client';

import { useAuth } from '@/context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, Zap, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.username || 'Usuario';

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-4 md:p-8 text-center">

      {/* Hero Section */}
      <div className="space-y-4 md:space-y-6 max-w-3xl animate-in fade-in zoom-in duration-700 mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-2 border border-blue-100 dark:border-blue-800">
          <Sparkles className="w-4 h-4" />
          <span>{process.env.NEXT_PUBLIC_APP_NAME || 'ERP System'} v1.0</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{firstName}</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
          Optimiza tus operaciones, gestiona recursos y toma decisiones estratégicas desde una plataforma unificada.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-500 animate-pulse">
            Selecciona un módulo del menú lateral para comenzar
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl w-full">
        <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:translate-y-[-4px] transition-all duration-300">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 md:mb-4 mx-auto">
            <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Modularidad Total</h3>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Navegación intuitiva organizada por departamentos y funcionalidades específicas.
          </p>
        </div>

        <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:translate-y-[-4px] transition-all duration-300">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 md:mb-4 mx-auto">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Seguridad Avanzada</h3>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Control de acceso basado en roles y permisos granulares para proteger tu información.
          </p>
        </div>

        <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:translate-y-[-4px] transition-all duration-300">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 md:mb-4 mx-auto">
            <Zap className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Alto Rendimiento</h3>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Interfaces optimizadas para una experiencia de usuario fluida y sin interrupciones.
          </p>
        </div>
      </div>

    </div>
  );
}
