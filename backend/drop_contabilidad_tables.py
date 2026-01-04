#!/usr/bin/env python
"""
Script to drop all contabilidad tables from the database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

# List of all contabilidad tables to drop
tables_to_drop = [
    'contabilidad_factura',
    'contabilidad_certificadodigital',
    'contabilidad_satformapago',
    'contabilidad_satmetodopago',
    'contabilidad_satregimenfiscal',
    'contabilidad_satusocfdi',
    'contabilidad_cliente',
    'contabilidad_banco',
    'contabilidad_moneda',
    'contabilidad_metodopago',
    'contabilidad_formapago',
    'contabilidad_tipocambio',
    'contabilidad_vendedor',
    'contabilidad_esquemacomision',
    'contabilidad_proyecto',
    'contabilidad_upe',
    'contabilidad_presupuesto',
    'contabilidad_planpago',
    'contabilidad_contrato',
    'contabilidad_pago',
    'contabilidad_cuentacontable',
    'contabilidad_centrocostos',
    'contabilidad_poliza',
    'contabilidad_detallepoliza',
    'contabilidad_empresafiscal',
    'contabilidad_buzonmensaje',
    'contabilidad_opinioncumplimiento',
]

with connection.cursor() as cursor:
    for table in tables_to_drop:
        try:
            cursor.execute(f'DROP TABLE IF EXISTS {table} CASCADE')
            print(f'✓ Dropped {table}')
        except Exception as e:
            print(f'✗ Error dropping {table}: {e}')

print('\n✅ All contabilidad tables dropped successfully')
