"""
Servicio de indexación de modelos para la IA.
Genera embeddings de los modelos del sistema para búsqueda semántica.
"""
import logging
from django.apps import apps
from django.db import transaction
from .models import KnowledgeBase
from .services.ai_service import AIService

logger = logging.getLogger(__name__)

class ModelIndexer:
    """
    Indexa modelos del sistema en la base de conocimientos de IA.
    """
    
    # Configuración de modelos a indexar
    MODELS_TO_INDEX = {
        'users': {
            'CustomUser': {
                'fields': ['email', 'first_name', 'last_name', 'puesto'],
                'permissions': ['users.view_customuser'],
                'template': 'Usuario: {first_name} {last_name} ({email}) - Puesto: {puesto}'
            }
        },
        'rrhh': {
            'Empleado': {
                'fields': ['nombre_completo', 'numero_empleado', 'puesto__nombre', 'departamento__nombre', 'salario_base'],
                'permissions': ['rrhh.view_empleado'],
                'template': 'Empleado #{numero_empleado}: {nombre_completo} - {puesto__nombre} en {departamento__nombre}'
            },
            'Departamento': {
                'fields': ['nombre', 'descripcion'],
                'permissions': ['rrhh.view_departamento'],
                'template': 'Departamento: {nombre} - {descripcion}'
            },
            'Puesto': {
                'fields': ['nombre', 'descripcion', 'nivel'],
                'permissions': ['rrhh.view_puesto'],
                'template': 'Puesto: {nombre} (Nivel {nivel}) - {descripcion}'
            }
        },
        'contabilidad': {
            'Cliente': {
                'fields': ['razon_social', 'rfc', 'email'],
                'permissions': ['contabilidad.view_cliente'],
                'template': 'Cliente: {razon_social} (RFC: {rfc}) - {email}'
            },
            'Proyecto': {
                'fields': ['nombre', 'descripcion', 'cliente__razon_social'],
                'permissions': ['contabilidad.view_proyecto'],
                'template': 'Proyecto: {nombre} para {cliente__razon_social} - {descripcion}'
            },
            'CuentaContable': {
                'fields': ['codigo', 'nombre', 'tipo'],
                'permissions': ['contabilidad.view_cuentacontable'],
                'template': 'Cuenta Contable {codigo}: {nombre} ({tipo})'
            }
        },
        'compras': {
            'Proveedor': {
                'fields': ['razon_social', 'rfc', 'email', 'telefono'],
                'permissions': ['compras.view_proveedor'],
                'template': 'Proveedor: {razon_social} (RFC: {rfc}) - {email}'
            },
            'OrdenCompra': {
                'fields': ['folio', 'proveedor__razon_social', 'total', 'estado'],
                'permissions': ['compras.view_ordencompra'],
                'template': 'Orden de Compra {folio} a {proveedor__razon_social} por ${total} - Estado: {estado}'
            },
            'Insumo': {
                'fields': ['nombre', 'descripcion', 'unidad_medida'],
                'permissions': ['compras.view_insumo'],
                'template': 'Insumo: {nombre} ({unidad_medida}) - {descripcion}'
            }
        },
        'tesoreria': {
            'CuentaBancaria': {
                'fields': ['banco__nombre_corto', 'numero_cuenta', 'tipo_cuenta', 'saldo_actual', 'moneda__codigo'],
                'permissions': ['tesoreria.view_cuentabancaria'],
                'template': 'Cuenta Bancaria {banco__nombre_corto} {numero_cuenta} ({tipo_cuenta}) - Saldo: ${saldo_actual} {moneda__codigo}'
            },
            'Egreso': {
                'fields': ['folio', 'beneficiario', 'concepto', 'monto', 'estado'],
                'permissions': ['tesoreria.view_egreso'],
                'template': 'Egreso {folio} a {beneficiario} por ${monto} - {concepto} ({estado})'
            },
            'CajaChica': {
                'fields': ['nombre', 'responsable__get_full_name', 'monto_fondo', 'saldo_actual', 'estado'],
                'permissions': ['tesoreria.view_cajachica'],
                'template': 'Caja Chica {nombre} (Responsable: {responsable__get_full_name}) - Fondo: ${monto_fondo}, Saldo: ${saldo_actual} ({estado})'
            },
            'ContraRecibo': {
                'fields': ['folio', 'proveedor__razon_social', 'tipo', 'total', 'saldo_pendiente', 'estado'],
                'permissions': ['tesoreria.view_contrarecibo'],
                'template': 'ContraRecibo {folio} de {proveedor__razon_social} ({tipo}) - Total: ${total}, Pendiente: ${saldo_pendiente} ({estado})'
            }
        },
        'pos': {
            'Producto': {
                'fields': ['nombre', 'codigo_barras', 'precio', 'stock'],
                'permissions': ['pos.view_producto'],
                'template': 'Producto: {nombre} (Código: {codigo_barras}) - Precio: ${precio}, Stock: {stock}'
            },
            'Venta': {
                'fields': ['folio', 'total', 'metodo_pago', 'estado'],
                'permissions': ['pos.view_venta'],
                'template': 'Venta {folio} por ${total} - {metodo_pago} ({estado})'
            }
        }
    }
    
    def __init__(self):
        self.ai_service = AIService()
    
    def get_field_value(self, obj, field_path):
        """
        Obtiene el valor de un campo, soportando relaciones (ej: 'puesto__nombre')
        """
        try:
            parts = field_path.split('__')
            value = obj
            
            for part in parts:
                if hasattr(value, part):
                    value = getattr(value, part)
                    # Si es un callable (como get_full_name), ejecutarlo
                    if callable(value):
                        value = value()
                else:
                    return None
            
            return value
        except Exception as e:
            logger.warning(f"Error obteniendo campo {field_path}: {e}")
            return None
    
    def generate_content(self, obj, config):
        """
        Genera el contenido de texto para indexar basado en la plantilla
        """
        template = config['template']
        fields = config['fields']
        
        # Obtener valores de los campos
        values = {}
        for field in fields:
            value = self.get_field_value(obj, field)
            values[field] = value if value is not None else ''
        
        # Formatear la plantilla
        try:
            content = template.format(**values)
            return content
        except Exception as e:
            logger.error(f"Error formateando plantilla: {e}")
            return None
    
    def generate_embedding(self, text):
        """
        Genera un embedding para el texto usando OpenAI
        (Requiere OPENAI_API_KEY configurado)
        """
        try:
            from openai import OpenAI
            import os
            
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("OPENAI_API_KEY no configurado, no se pueden generar embeddings")
                return None
            
            client = OpenAI(api_key=api_key)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generando embedding: {e}")
            return None
    
    def index_model(self, app_label, model_name, limit=None):
        """
        Indexa un modelo específico en la base de conocimientos
        """
        if app_label not in self.MODELS_TO_INDEX:
            logger.warning(f"App {app_label} no configurada para indexación")
            return 0
        
        if model_name not in self.MODELS_TO_INDEX[app_label]:
            logger.warning(f"Modelo {model_name} no configurado para indexación")
            return 0
        
        config = self.MODELS_TO_INDEX[app_label][model_name]
        
        try:
            Model = apps.get_model(app_label, model_name)
            queryset = Model.objects.all()
            
            if limit:
                queryset = queryset[:limit]
            
            indexed_count = 0
            
            for obj in queryset:
                # Generar contenido
                content = self.generate_content(obj, config)
                if not content:
                    continue
                
                # Generar embedding
                embedding = self.generate_embedding(content)
                if not embedding:
                    logger.warning(f"No se pudo generar embedding para {app_label}.{model_name} #{obj.pk}")
                    continue
                
                # Guardar o actualizar en KnowledgeBase
                with transaction.atomic():
                        kb, created = KnowledgeBase.objects.update_or_create(
                            source_app=app_label,
                            source_model=model_name,
                            source_id=str(obj.pk),
                            empresa=getattr(obj, 'empresa', None),
                            defaults={
                                'content': content,
                                'required_permissions': ','.join(config['permissions']),
                                'embedding': embedding
                            }
                        )
                    indexed_count += 1
                    
                    if created:
                        logger.info(f"Indexado: {content[:100]}...")
                    else:
                        logger.info(f"Actualizado: {content[:100]}...")
            
            return indexed_count
        
        except Exception as e:
            logger.error(f"Error indexando {app_label}.{model_name}: {e}")
            return 0
    
    def index_all(self, limit_per_model=None):
        """
        Indexa todos los modelos configurados
        """
        total_indexed = 0
        
        for app_label, models in self.MODELS_TO_INDEX.items():
            for model_name in models.keys():
                logger.info(f"Indexando {app_label}.{model_name}...")
                count = self.index_model(app_label, model_name, limit=limit_per_model)
                total_indexed += count
                logger.info(f"  → {count} registros indexados")
        
        logger.info(f"Total indexado: {total_indexed} registros")
        return total_indexed
    
    def search(self, query, user, limit=10):
        """
        Busca en la base de conocimientos usando similitud semántica
        Filtra por permisos del usuario
        """
        # Generar embedding de la consulta
        query_embedding = self.generate_embedding(query)
        if not query_embedding:
            return []
        
        # Obtener permisos del usuario
        user_permissions = set(user.get_all_permissions())
        
        # Buscar en la base de conocimientos
        from core.middleware import get_current_company_id
        company_id = get_current_company_id()
        
        try:
            from django.db.models import F
            from pgvector.django import CosineDistance
            
            queryset = KnowledgeBase.objects.all()
            if company_id:
                queryset = queryset.filter(empresa_id=company_id)
                
            results = queryset.annotate(
                distance=CosineDistance('embedding', query_embedding)
            ).order_by('distance')[:limit * 2]
            
            # Filtrar por permisos
            filtered_results = []
            for result in results:
                required_perms = set(result.required_permissions.split(',')) if result.required_permissions else set()
                
                # Si el usuario tiene al menos uno de los permisos requeridos
                if not required_perms or user_permissions.intersection(required_perms):
                    filtered_results.append({
                        'content': result.content,
                        'source': f"{result.source_app}.{result.source_model}",
                        'source_id': result.source_id,
                        'distance': result.distance
                    })
                    
                    if len(filtered_results) >= limit:
                        break
            
            return filtered_results
        
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return []
