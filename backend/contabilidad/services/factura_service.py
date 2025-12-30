from django.core.files.base import ContentFile
from contabilidad.models import Factura, Moneda, MetodoPago
from .xml_parser import parse_cfdi

class FacturaService:
    @staticmethod
    def procesar_factura(archivo):
        nombre_archivo = archivo.name
        try:
            # 1. Leer y Parsear
            contenido = archivo.read()
            data = parse_cfdi(contenido)
            
            # 2. Verificar Duplicidad
            if Factura.objects.filter(uuid=data['uuid']).exists():
                return {
                    "status": "error",
                    "mensaje": f"UUID {data['uuid']} ya existe."
                }

            # 3. Resolver Foreign Keys
            moneda, _ = Moneda.objects.get_or_create(
                codigo=data['moneda'], 
                defaults={'nombre': data['moneda']}
            )
            
            metodo_pago = None
            if data['metodo_pago']:
                metodo_pago = MetodoPago.objects.filter(nombre__icontains=data['metodo_pago']).first()

            # 4. Crear Factura
            factura = Factura.objects.create(
                version=data['version'],
                uuid=data['uuid'],
                serie=data['serie'],
                folio=data['folio'],
                fecha_emision=data['fecha_emision'],
                fecha_timbrado=data['fecha_timbrado'],
                emisor_rfc=data['rfc_emisor'],
                emisor_nombre=data['nombre_emisor'],
                emisor_regimen=data['regimen_emisor'],
                receptor_rfc=data['rfc_receptor'],
                receptor_nombre=data['nombre_receptor'],
                receptor_regimen=data['regimen_receptor'],
                uso_cfdi=data['uso_cfdi'],
                total=data['total'],
                subtotal=data['subtotal'],
                moneda=moneda,
                tipo_cambio=data['tipo_cambio'],
                tipo_comprobante=data['tipo_comprobante'],
                metodo_pago=metodo_pago,
                xml_archivo=ContentFile(contenido, name=f"{data['uuid']}.xml")
            )
            
            return {
                "status": "success",
                "uuid": data['uuid']
            }

        except Exception as e:
            return {
                "status": "error",
                "mensaje": str(e)
            }
