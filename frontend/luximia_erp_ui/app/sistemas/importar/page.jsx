'use client';

import React, { useState } from 'react';
import DataImporter from '@/components/features/data/DataImporter';
import {
  importarDatosMasivos,
  importarBancos,
  importarMonedas,
  importarClientes,
  importarDepartamentos,
  importarPuestos,
  importarEmpleados,
  importarVendedores,
  importarProyectos,
  importarUPEs,
  importarPresupuestos,
  importarPlanesPago,
  importarEsquemasComision,
  importarTiposCambio,
  importarContratos,
  importarPagosHistoricos,
  importarFormasPago,
} from '@/services/api';

const IMPORTS = {
  masivo: {
    label: 'Masivo (General)',
    headers: [
      'proyecto_nombre',
      'upe_identificador',
      'upe_valor_total',
      'upe_moneda',
      'upe_estado',
      'cliente_nombre',
      'cliente_email',
      'cliente_telefono',
      'contrato_fecha_venta',
      'contrato_precio_pactado',
      'contrato_moneda',
      'monto_enganche',
      'numero_mensualidades',
      'tasa_interes_mensual',
    ],
    templateName: 'plantilla_importacion_masiva.csv',
    description: 'Sube un archivo .csv con la estructura completa.',
    buttonText: 'Subir y Procesar Archivo Completo',
    importFn: importarDatosMasivos,
  },
  clientes: {
    label: 'Clientes',
    headers: ['nombre_completo', 'email', 'telefono'],
    templateName: 'plantilla_clientes.csv',
    description: 'Sube un archivo .csv solo con datos de clientes.',
    buttonText: 'Subir y Procesar Clientes',
    importFn: importarClientes,
  },
  bancos: {
    label: 'Bancos',
    headers: ['clave', 'nombre_corto', 'razon_social'],
    templateName: 'plantilla_bancos.csv',
    description: 'Sube un archivo .csv con datos de bancos.',
    buttonText: 'Subir y Procesar Bancos',
    importFn: importarBancos,
  },
  monedas: {
    label: 'Monedas',
    headers: ['codigo', 'nombre'],
    templateName: 'plantilla_monedas.csv',
    description: 'Sube un archivo .csv con datos de monedas.',
    buttonText: 'Subir y Procesar Monedas',
    importFn: importarMonedas,
  },
  'formas-pago': {
    label: 'Formas de Pago',
    headers: ['enganche', 'mensualidades', 'meses', 'contra_entrega'],
    templateName: 'plantilla_formas_pago.csv',
    description: 'Sube un archivo .csv con datos de formas de pago.',
    buttonText: 'Subir y Procesar Formas de Pago',
    importFn: importarFormasPago,
  },
  upes: {
    label: 'UPEs',
    headers: ['proyecto_nombre', 'identificador', 'valor_total', 'moneda', 'estado'],
    templateName: 'plantilla_upes.csv',
    description: 'Sube un archivo .csv con datos de UPEs.',
    buttonText: 'Subir y Procesar UPEs',
    importFn: importarUPEs,
  },
  proyectos: {
    label: 'Proyectos',
    headers: [
      'nombre',
      'descripcion',
      'numero_upes',
      'niveles',
      'metros_cuadrados',
      'numero_estacionamientos',
      'valor_total',
      'estado',
    ],
    templateName: 'plantilla_proyectos.csv',
    description: 'Sube un archivo .csv con datos de proyectos.',
    buttonText: 'Subir y Procesar Proyectos',
    importFn: importarProyectos,
  },
  departamentos: {
    label: 'Departamentos',
    headers: ['nombre'],
    templateName: 'plantilla_departamentos.csv',
    description: 'Sube un archivo .csv con datos de departamentos.',
    buttonText: 'Subir y Procesar Departamentos',
    importFn: importarDepartamentos,
  },
  puestos: {
    label: 'Puestos',
    headers: ['nombre', 'descripcion', 'departamento_id'],
    templateName: 'plantilla_puestos.csv',
    description: 'Sube un archivo .csv con datos de puestos.',
    buttonText: 'Subir y Procesar Puestos',
    importFn: importarPuestos,
  },
  empleados: {
    label: 'Empleados',
    headers: ['user_id', 'nombre_completo', 'puesto_id', 'departamento_id'],
    templateName: 'plantilla_empleados.csv',
    description: 'Sube un archivo .csv con datos de empleados.',
    buttonText: 'Subir y Procesar Empleados',
    importFn: importarEmpleados,
  },
  vendedores: {
    label: 'Vendedores',
    headers: ['tipo', 'nombre_completo', 'email', 'telefono'],
    templateName: 'plantilla_vendedores.csv',
    description: 'Sube un archivo .csv con datos de vendedores.',
    buttonText: 'Subir y Procesar Vendedores',
    importFn: importarVendedores,
  },
  'planes-pago': {
    label: 'Planes de Pago',
    headers: [
      'cliente_id',
      'upe_id',
      'apartado_monto',
      'moneda_apartado_id',
      'fecha_apartado',
      'forma_pago_enganche_id',
      'monto_enganche',
      'moneda_enganche_id',
      'fecha_enganche',
      'forma_pago_mensualidades_id',
      'monto_mensualidades',
      'moneda_mensualidades_id',
      'forma_pago_meses_id',
      'meses',
      'monto_mensual',
      'moneda_mensual_id',
      'forma_pago_contra_entrega_id',
      'monto_contra_entrega',
      'moneda_contra_entrega_id',
    ],
    templateName: 'plantilla_planes_pago.csv',
    description: 'Sube un archivo .csv con datos de planes de pago.',
    buttonText: 'Subir y Procesar Planes de Pago',
    importFn: importarPlanesPago,
  },
  'esquemas-comision': {
    label: 'Esquemas de Comisión',
    headers: ['esquema', 'escenario', 'porcentaje', 'iva'],
    templateName: 'plantilla_esquemas_comision.csv',
    description: 'Sube un archivo .csv con datos de esquemas de comisión.',
    buttonText: 'Subir y Procesar Esquemas de Comisión',
    importFn: importarEsquemasComision,
  },
  presupuestos: {
    label: 'Presupuestos',
    headers: [
      'cliente_id',
      'upe_id',
      'moneda_id',
      'tipo_cambio_id',
      'forma_pago_id',
      'precio_m2',
      'precio_lista',
      'descuento',
      'precio_con_descuento',
      'enganche',
      'saldo',
      'plan_pago_id',
      'fecha_entrega_pactada',
      'negociaciones_especiales',
    ],
    templateName: 'plantilla_presupuestos.csv',
    description: 'Sube un archivo .csv con datos de presupuestos.',
    buttonText: 'Subir y Procesar Presupuestos',
    importFn: importarPresupuestos,
  },
  'tipos-cambio': {
    label: 'Tipos de Cambio',
    headers: ['escenario', 'fecha', 'valor'],
    templateName: 'plantilla_tipos_cambio.csv',
    description: 'Sube un archivo .csv con datos de tipos de cambio.',
    buttonText: 'Subir y Procesar Tipos de Cambio',
    importFn: importarTiposCambio,
  },
  contratos: {
    label: 'Contratos',
    headers: [
      'cliente_email',
      'proyecto_nombre',
      'upe_identificador',
      'fecha_venta',
      'contrato_precio_pactado',
      'moneda_pactada',
      'monto_enganche',
      'numero_mensualidades',
      'tasa_interes_mensual',
    ],
    templateName: 'plantilla_contratos.csv',
    description: 'Sube un archivo .csv con datos de contratos.',
    buttonText: 'Subir y Procesar Contratos',
    importFn: importarContratos,
  },
  pagos: {
    label: 'Pagos Históricos',
    headers: [
      'CONTRATO_ID',
      'monto_pagado',
      'moneda_pagada',
      'tipo_cambio',
      'fecha_pago',
      'concepto',
      'metodo_pago',
      'ordenante',
      'banco_origen',
      'num_cuenta_origen',
      'banco_destino',
      'cuenta_beneficiaria',
      'comentarios',
      'fecha_ingreso_cuentas',
    ],
    templateName: 'plantilla_pagos.csv',
    description: 'Sube un archivo .csv con el histórico de pagos.',
    buttonText: 'Subir y Procesar Pagos',
    importFn: importarPagosHistoricos,
  },
};

export default function ImportarPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  // Filtramos las opciones basadas en la búsqueda
  const filteredImports = Object.entries(IMPORTS).filter(([key, imp]) =>
    imp.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConfig = selectedKey ? IMPORTS[selectedKey] : null;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-[calc(100vh-100px)]">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Centro de Importación
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona la carga masiva de datos para tu sistema ERP.
          </p>
        </div>

        {selectedKey && (
          <button
            onClick={() => { setSelectedKey(null); setSearchTerm(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            ← Volver al catálogo
          </button>
        )}
      </div>

      {!selectedKey ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar módulo a importar (ej. Clientes, Bancos...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Grid de Opciones */}
          {filteredImports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImports.map(([key, imp]) => (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className="group relative flex flex-col items-start p-6 rounded-2xl bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {/* Icono genérico o específico si se desea mapear */}
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {imp.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {imp.description}
                  </p>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-blue-600 dark:text-blue-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No se encontraron módulos que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <DataImporter config={selectedConfig} />
        </div>
      )}
    </div>
  );
}

