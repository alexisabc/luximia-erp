from decimal import Decimal
from django.db import transaction
from django.db.models import Max
from datetime import date
from contabilidad.models.contabilidad import Poliza, DetallePoliza
from contabilidad.models_automation import PlantillaAsiento

class PolizaGeneratorService:
    @staticmethod
    def generar_poliza(nombre_plantilla, context_data, referencia_modulo, referencia_id, user):
        """
        Genera una Poliza contable basada en una Plantilla.
        
        Args:
            nombre_plantilla (str): Nombre exacto de la PlantillaAsiento.
            context_data (dict): Diccionario con valore para reglas. Ej: {'SUBTOTAL': 100, 'IVA_16': 16, 'TOTAL': 116}
            referencia_modulo (str): Ej: 'COMPRAS'
            referencia_id (str): ID del objeto origen (ODC ID, CR ID)
            user: Usuario que detona la accion.
        """
        try:
            plantilla = PlantillaAsiento.objects.get(nombre=nombre_plantilla, activo=True)
        except PlantillaAsiento.DoesNotExist:
            print(f"Warning: Plantilla '{nombre_plantilla}' no encontrada o inactiva. No se generó póliza.")
            return None

        # 1. Calcular Consecutivo
        # Logica simplificada: consecutivo global por tipo
        last_num = Poliza.objects.filter(tipo=plantilla.tipo_poliza).aggregate(Max('numero'))['numero__max'] or 0
        nuevo_numero = last_num + 1
        
        # Parse Concepto
        # concepto_patron ej: "Provisión ODC {folio}"
        concepto_final = plantilla.concepto_patron.format(**context_data) if plantilla.concepto_patron else f"Poliza autogen {referencia_id}"

        with transaction.atomic():
            poliza = Poliza.objects.create(
                fecha=date.today(),
                tipo=plantilla.tipo_poliza,
                numero=nuevo_numero,
                concepto=concepto_final,
                origen_modulo=referencia_modulo,
                origen_id=str(referencia_id),
                creado_por=user
            )
            
            total_debe = Decimal(0)
            total_haber = Decimal(0)
            
            for regla in plantilla.reglas.all().order_by('orden'):
                # Resolver Monto
                origen = regla.origen_dato
                monto = Decimal(context_data.get(origen, 0))
                
                if monto == 0:
                    continue # Skip zero lines
                
                debe = monto if regla.tipo_movimiento == 'CARGO' else Decimal(0)
                haber = monto if regla.tipo_movimiento == 'ABONO' else Decimal(0)
                
                DetallePoliza.objects.create(
                    poliza=poliza,
                    cuenta=regla.cuenta_base, # TODO: Resolve dynamic accounts (Prov/Client)
                    concepto=concepto_final,
                    debe=debe,
                    haber=haber,
                    referencia=str(referencia_id),
                    creado_por=user
                )
                
                total_debe += debe
                total_haber += haber
            
            # Update totals
            poliza.total_debe = total_debe
            poliza.total_haber = total_haber
            poliza.cuadrada = abs(total_debe - total_haber) < Decimal('0.01')
            poliza.save()
            
            return poliza
