'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardResumen } from '@/services/core.service';
import { toast } from 'react-hot-toast';
import {
  DollarSign,
  Landmark,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from 'next/link';
import DailyBriefingWidget from '@/components/DailyBriefingWidget';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  // Capitalize first letter of today
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardResumen();
      setData(response.data);
    } catch (error) {
      console.error("Dashboard Error:", error);
      // toast.error("Error cargando dashboard"); // Optional: suppress if common on init
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '--';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  // Skeletons
  if (loading) {
    return <DashboardSkeleton user={user} date={formattedDate} />;
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, <span className="text-blue-600">{user?.first_name || user?.username}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1 capitalize-first">{formattedDate}</p>
        </div>
      </header>

      {/* AI Daily Briefing - NEW */}
      <div className="mb-8">
        <DailyBriefingWidget />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Ventas Hoy"
          value={formatCurrency(data?.kpis?.ventas_hoy)}
          icon={DollarSign}
          color="text-green-600"
          bg="bg-green-50"
          trend={data?.kpis?.ventas_hoy > 0 ? "Activo" : "Sin ventas"}
        />
        <KPICard
          title="Saldo Bancos"
          value={data?.kpis?.saldo_bancos !== null ? formatCurrency(data?.kpis?.saldo_bancos) : "Oculto"}
          icon={Landmark}
          color="text-blue-600"
          bg="bg-blue-50"
          blur={data?.kpis?.saldo_bancos === null}
        />
        <KPICard
          title="Por Pagar (Mes)"
          value={formatCurrency(data?.kpis?.cxp_mes)}
          icon={FileText}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <KPICard
          title="Nómina Activa"
          value={data?.kpis?.nomina_activa !== null ? formatCurrency(data?.kpis?.nomina_activa) : "Oculto"}
          icon={Users}
          color="text-violet-600"
          bg="bg-violet-50"
          blur={data?.kpis?.nomina_activa === null}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Chart (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Tendencia de Ventas (Semanal)
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.grafica?.labels?.map((label, i) => ({ name: label, value: data.grafica.data[i] }))}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Venta']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Action Center (1/3) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-gray-400" />
            Pendientes Operativos
          </h2>

          <div className="space-y-4">
            {(!data?.acciones || data.acciones.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3 opacity-20" />
                <p>🎉 ¡Todo al día!</p>
                <p className="text-sm">No hay acciones requeridas.</p>
              </div>
            ) : (
              data.acciones.map((accion, idx) => (
                <Link href={accion.link || '#'} key={idx}>
                  <div className={`p-4 rounded-xl border-l-4 mb-3 transition-transform hover:translate-x-1 cursor-pointer
                                        ${accion.tipo === 'warning' ? 'border-yellow-400 bg-yellow-50/50' :
                      accion.tipo === 'error' ? 'border-red-500 bg-red-50/50' :
                        'border-blue-500 bg-blue-50/50'}`}>
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${accion.tipo === 'warning' ? 'text-yellow-800' :
                        accion.tipo === 'error' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                        {accion.mensaje}
                      </p>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color, bg, blur }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <div className={`text-2xl font-bold text-gray-900 ${blur ? 'blur-sm select-none' : ''}`}>
          {value}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function DashboardSkeleton({ user, date }) {
  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <header className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-2"></div>
        <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl h-[380px] p-6 border border-gray-100">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-full w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="bg-white rounded-2xl h-[380px] p-6 border border-gray-100">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
