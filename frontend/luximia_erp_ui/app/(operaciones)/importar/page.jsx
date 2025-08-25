'use client';

import React, { useState } from 'react';
import DataImporter from '@/components/ui/DataImporter';
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
  const [importInput, setImportInput] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setImportInput(value);
    const foundKey = Object.keys(IMPORTS).find((k) => IMPORTS[k].label === value);
    setSelectedKey(foundKey || null);
  };

  const selectedConfig = selectedKey ? IMPORTS[selectedKey] : null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Importaciones</h1>
      <input
        list="import-options"
        type="text"
        placeholder="Buscar y seleccionar importación..."
        value={importInput}
        onChange={handleChange}
        className="px-3 py-2 border rounded-md max-w-sm dark:bg-gray-800 dark:border-gray-700"
      />
      <datalist id="import-options">
        {Object.entries(IMPORTS).map(([key, imp]) => (
          <option key={key} value={imp.label} />
        ))}
      </datalist>
      {selectedConfig && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Importación de {selectedConfig.label}
          </h2>
          <DataImporter config={selectedConfig} />
        </div>
      )}
    </div>
  );
}

