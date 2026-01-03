#!/usr/bin/env python
"""
Verificación simplificada Sprint 27: Tesorería y Complemento de Pago
Solo prueba las funciones core sin crear datos de prueba complejos
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from tesoreria.services.deuda_service import DeudaService
from tesoreria.services.pago_service import PagoService
from tesoreria.models import CuentaBancaria, MovimientoBancario
from pos.models import Venta

def main():
    print("=== VERIFICACIÓN SPRINT 27: TESORERÍA Y COMPLEMENTO DE PAGO ===\n")

    # 1. Verificar que existen cuentas bancarias
    cuentas = CuentaBancaria.objects.filter(activa=True)
    print(f"✓ Cuentas bancarias activas: {cuentas.count()}")
    if cuentas.exists():
        for cuenta in cuentas[:3]:
            print(f"  - {cuenta.banco.nombre_corto}: ${cuenta.saldo_actual}")
    
    # 2. Verificar servicio de deudas
    print(f"\n--- SERVICIO DE DEUDAS ---")
    try:
        deudas = DeudaService.obtener_balance()
        print(f"✓ DeudaService.obtener_balance() funciona")
        print(f"  CXC Total: ${deudas['cxc']['total']}")
        print(f"  CXP Total: ${deudas['cxp']['total']}")
        print(f"  Items CXC: {len(deudas['cxc']['items'])}")
        print(f"  Items CXP: {len(deudas['cxp']['items'])}")
    except AttributeError as e:
        print(f"⚠️  DeudaService.obtener_balance() no existe: {e}")
    except Exception as e:
        print(f"❌ Error en DeudaService: {e}")
    
    # 3. Verificar ventas pendientes
    ventas_pendientes = Venta.objects.filter(
        metodo_pago='PPD',
        saldo_pendiente__gt=0
    ).order_by('-created_at')[:5]
    
    print(f"\n--- VENTAS PENDIENTES (PPD) ---")
    print(f"Total ventas PPD con saldo pendiente: {ventas_pendientes.count()}")
    
    if ventas_pendientes.exists():
        for venta in ventas_pendientes:
            print(f"  - {venta.folio}: Saldo ${venta.saldo_pendiente}")
    
    # 4. Verificar movimientos bancarios recientes
    movimientos = MovimientoBancario.objects.order_by('-fecha')[:5]
    print(f"\n--- MOVIMIENTOS BANCARIOS RECIENTES ---")
    print(f"Total movimientos: {MovimientoBancario.objects.count()}")
    
    if movimientos.exists():
        for mov in movimientos:
            tipo_icon = "↑" if mov.tipo == 'INGRESO' else "↓"
            print(f"  {tipo_icon} {mov.fecha.strftime('%Y-%m-%d')}: ${mov.monto} - {mov.concepto[:50]}")
    
    # 5. Verificar que PagoService existe
    print(f"\n--- SERVICIO DE PAGOS ---")
    if hasattr(PagoService, 'registrar_pago_cliente'):
        print(f"✓ PagoService.registrar_pago_cliente() existe")
    else:
        print(f"❌ PagoService.registrar_pago_cliente() NO existe")
    
    print("\n✅ VERIFICACIÓN BÁSICA COMPLETADA")
    print("\nPara probar el flujo completo de pago:")
    print("1. Crea una venta con metodo_pago='PPD' desde el frontend")
    print("2. Usa el modal de 'Registrar Cobro' en la pestaña CXC")
    print("3. Verifica que se genere el MovimientoBancario y el REP")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
