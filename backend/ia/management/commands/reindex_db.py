from django.core.management.base import BaseCommand
from django.apps import apps
from ia.rag import index_instance
from ia.models import KnowledgeBase

class Command(BaseCommand):
    help = 'Re-indexa toda la base de datos en la KnowledgeBase de IA'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando re-indexado completo...")
        
        # Limpiar índice actual
        deleted, _ = KnowledgeBase.objects.all().delete()
        self.stdout.write(f"Índice limpio. {deleted} entradas eliminadas.")
        
        count = 0
        MODELS_TO_INDEX = [
            # Lista explícita de modelos importantes para controlar costos/ruido
            'contabilidad.Proyecto',
            'contabilidad.UPE',
            'contabilidad.Cliente',
            'contabilidad.Contrato',
            'contabilidad.Pago',
            'contabilidad.Presupuesto',
            'rrhh.Empleado',
            'rrhh.Departamento',
        ]
        
        for model_path in MODELS_TO_INDEX:
            try:
                app_label, model_name = model_path.split('.')
                model = apps.get_model(app_label, model_name)
                
                self.stdout.write(f"Indexando {model_name}...")
                qs = model.objects.all()
                for obj in qs:
                    index_instance(obj)
                    count += 1
                    if count % 50 == 0:
                        self.stdout.write(f"  ... {count} objetos procesados")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error procesando {model_path}: {e}"))
                
        self.stdout.write(self.style.SUCCESS(f"Re-indexado finalizado. Total: {count} documentos."))
