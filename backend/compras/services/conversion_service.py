from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
from ..models import Requisicion, OrdenCompra, DetalleOrdenCompra, Proveedor, Insumo

class ConversionService:
    @staticmethod
    @transaction.atomic
    def convertir_req_a_oc(requisicion_id, proveedor_id, detalles_precios, usuario):
        """
        Transforma una Requisición APROBADA en una Orden de Compra.
        """
        try:
            req = Requisicion.objects.select_for_update().get(id=requisicion_id)
        except Requisicion.DoesNotExist:
            raise ValidationError("Requisición no encontrada")
        
        if req.estado != 'APROBADA':
            raise ValidationError(f"La requisición está en estado {req.estado}, debe estar APROBADA.")
            
        try:
            proveedor = Proveedor.objects.get(id=proveedor_id)
        except Proveedor.DoesNotExist:
            raise ValidationError("Proveedor no encontrado")
        
        # Moneda Default (MXN)
        from contabilidad.models import Moneda
        moneda = Moneda.objects.first() # Asumimos que existe alguna moneda
        if not moneda:
            raise ValidationError("No hay monedas configuradas en el sistema")

        # Crear Header Orden Compra
        oc = OrdenCompra.objects.create(
            proveedor=proveedor,
            solicitante=req.usuario_solicitante,
            requisicion=req,
            motivo_compra=f"Requisición #{req.id} - {req.observaciones[:50]}",
            moneda=moneda,
            departamento=f"Obra: {req.obra.codigo if req.obra else 'N/A'}",
            estado='BORRADOR',
            proyecto=None # Sin link contable por ahora
        )
        
        # Crear Detalles
        for item in detalles_precios:
            insumo_id = item.get('producto_id')
            texto = item.get('producto_texto')
            cantidad = Decimal(str(item.get('cantidad')))
            precio = Decimal(str(item.get('precio_unitario')))
            
            if not insumo_id:
                # Crear insumo al vuelo si es necesario para mantener integridad FK
                codigo_sugerido = f"GEN-{str(texto)[:5].upper()}-{usuario.id}"
                insumo, created = Insumo.objects.get_or_create(
                    descripcion__iexact=texto,
                    defaults={
                        'codigo': codigo_sugerido, 
                        'descripcion': texto, 
                        'tipo': 'PRODUCTO', 
                        'unidad_medida': 'PZA'
                    }
                )
                insumo_id = insumo.id
            
            DetalleOrdenCompra.objects.create(
                orden=oc,
                insumo_id=insumo_id,
                descripcion_personalizada=texto,
                cantidad=cantidad,
                precio_unitario=precio,
                descuento=0,
                impuesto_tasa=Decimal('0.16')
            )
            
        # Actualizar totales OC
        detalles = oc.detalles.all()
        subtotal = sum(d.importe for d in detalles)
        iva = subtotal * Decimal('0.16')
        oc.subtotal = subtotal
        oc.iva = iva
        oc.total = subtotal + iva
        oc.save()
        
        # Actualizar Req
        req.estado = 'COMPRADA'
        req.save()
        
        return oc
