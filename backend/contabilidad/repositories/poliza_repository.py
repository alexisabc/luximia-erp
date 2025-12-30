from django.db import transaction
from decimal import Decimal
from contabilidad.models import Poliza, DetallePoliza

class PolizaRepository:
    @staticmethod
    def get_by_id(uid):
        return Poliza.objects.get(pk=uid)

    @staticmethod
    def create(data):
        with transaction.atomic():
            # Create Header
            poliza = Poliza.objects.create(
                fecha=data['fecha'],
                tipo=data['tipo'],
                numero=data['numero'],
                concepto=data['concepto'],
                # Optional fields
                origen_modulo=data.get('origen_modulo'),
                origen_id=data.get('origen_id')
            )
            
            total_debe = Decimal(0)
            total_haber = Decimal(0)
            
            # Create Details
            detalles_data = data.get('detalles', [])
            for det in detalles_data:
                debe = Decimal(det.get('debe', 0))
                haber = Decimal(det.get('haber', 0))
                
                DetallePoliza.objects.create(
                    poliza=poliza,
                    cuenta_id=det['cuenta_id'],
                    concepto=det.get('concepto', ''),
                    debe=debe,
                    haber=haber,
                    referencia=det.get('referencia'),
                    centro_costos_id=det.get('centro_costos_id')
                )
                
                total_debe += debe
                total_haber += haber
            
            # Update Totals
            poliza.total_debe = total_debe
            poliza.total_haber = total_haber
            poliza.cuadrada = (total_debe == total_haber)
            poliza.save()
            
            return poliza

    @staticmethod
    def delete(uid):
        """Soft delete of a Poliza."""
        poliza = Poliza.objects.get(pk=uid)
        poliza.activo = False
        poliza.save()
