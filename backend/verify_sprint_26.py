import os
import django
from decimal import Decimal
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rrhh.models import Empleado, Asistencia, TipoIncidencia, OrigenChecada, DistribucionCosto, PeriodoNomina
from rrhh.models_nomina import Nomina, ReciboNomina
from rrhh.services.nomina_engine import NominaEngine
from rrhh.services.impacto_costos import ImpactoCostosService
from obras.models import Obra, CentroCosto, PartidaPresupuestal

def verify_sprint_26():
    print("🚀 Starting Verification for Sprint 26...")
    
    # 1. Setup Obra Partida
    obra = Obra.objects.get(id=1) # Torre Luximia
    cc = CentroCosto.objects.get(id=1) # Cimentación
    partida, created = PartidaPresupuestal.objects.get_or_create(
        centro_costo=cc,
        categoria='MANO_OBRA',
        defaults={'monto_estimado': Decimal('50000.00')}
    )
    initial_ejecutado = partida.monto_ejecutado
    print(f"Initial ejecutado for {partida}: ${initial_ejecutado}")

    # 2. Setup Empleado (Juan Pérez from previous seed)
    empleado = Empleado.objects.get(user__username='juan.perez')
    
    # 3. Create Attendances for 1st Fortnight of Jan 2026
    start_date = date(2026, 1, 1)
    end_date = date(2026, 1, 15)
    
    # Clear existing for period to ensure clean test
    Asistencia.objects.filter(empleado=empleado, fecha__range=(start_date, end_date)).delete()
    
    # 12 Days worked, 3 days absence
    for i in range(15):
        current_date = start_date + timedelta(days=i)
        incidencia = TipoIncidencia.ASISTENCIA if i < 12 else TipoIncidencia.FALTA
        
        asistencia = Asistencia.objects.create(
            empleado=empleado,
            fecha=current_date,
            incidencia=incidencia,
            hora_entrada="08:00",
            hora_salida="17:00",
            origen=OrigenChecada.MANUAL,
            empresa=empleado.empresa
        )
        
        if incidencia == TipoIncidencia.ASISTENCIA:
            # Assign 100% to Torre Luximia
            DistribucionCosto.objects.create(
                asistencia=asistencia,
                obra=obra,
                centro_costo=cc,
                porcentaje=100,
                empresa=empleado.empresa
            )

    print("✅ Created 12 attendances and 3 absences.")

    # 4. Calculate Payroll for this period
    resultado = NominaEngine.calcular_prenomina(empleado, start_date, end_date)
    print(f"Payroll Result: Sueldo Bruto ${resultado['sueldo_bruto']}, Neto ${resultado['neto_pagar']}")
    # Expected: 12 days * 500 = 6000.00

    # 5. Simulate Payroll Closing (Create Nomina and Recibo)
    periodo_obj, _ = PeriodoNomina.objects.get_or_create(
        anio=2026,
        tipo='QUINCENAL',
        numero=1,
        defaults={
            'fecha_inicio': start_date,
            'fecha_fin': end_date
        }
    )
    
    nomina_obj = Nomina.objects.create(
        descripcion="Nómina Operativa Ene Q1 2026",
        fecha_inicio=start_date,
        fecha_fin=end_date,
        fecha_pago=date(2026, 1, 15),
        razon_social=empleado.razon_social,
        empresa=empleado.empresa
    )
    
    recibo = ReciboNomina.objects.create(
        nomina=nomina_obj,
        empleado=empleado,
        salario_diario=Decimal('500.00'),
        sbc=Decimal('525.00'),
        subtotal=Decimal(str(resultado['sueldo_bruto'])),
        impuestos_retenidos=Decimal(str(resultado['retenciones']['isr'])),
        imss_retenido=Decimal(str(resultado['retenciones']['imss'])),
        neto=Decimal(str(resultado['neto_pagar'])),
        # empresa=empleado.empresa # ReciboNomina might not have empresa? let me check meta
    )

    # 6. Run ImpactoCostosService
    ImpactoCostosService.registrar_impacto_nomina(nomina_obj)
    
    # 7. Final Validation
    partida.refresh_from_db()
    final_ejecutado = partida.monto_ejecutado
    impacto = final_ejecutado - initial_ejecutado
    
    print(f"Final ejecutado for {partida}: ${final_ejecutado}")
    print(f"Total Impact: ${impacto}")

    if impacto == Decimal(str(resultado['sueldo_bruto'])):
        print("⭐️ SUCCESS: Cost distribution matches payroll gross salary exactly!")
    else:
        # Note: In real life it might differ if distribution is partial, 
        # but here we did 100% for all 12 days.
        print(f"Verification finished. Impact: {impacto}, Expected: {resultado['sueldo_bruto']}")

if __name__ == "__main__":
    verify_sprint_26()
