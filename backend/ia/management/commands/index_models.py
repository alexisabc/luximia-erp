"""
Comando de gestión para indexar modelos en la base de conocimientos de IA.
"""
from django.core.management.base import BaseCommand
from ia.indexer import ModelIndexer


class Command(BaseCommand):
    help = 'Indexa modelos del sistema en la base de conocimientos de IA'

    def add_arguments(self, parser):
        parser.add_argument(
            '--app',
            type=str,
            help='App específica a indexar (ej: rrhh, tesoreria)',
        )
        parser.add_argument(
            '--model',
            type=str,
            help='Modelo específico a indexar (ej: Empleado, CuentaBancaria)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Límite de registros por modelo a indexar',
        )

    def handle(self, *args, **options):
        indexer = ModelIndexer()
        
        app = options.get('app')
        model = options.get('model')
        limit = options.get('limit')
        
        self.stdout.write(self.style.SUCCESS('🤖 Iniciando indexación de modelos para IA...'))
        
        if app and model:
            # Indexar modelo específico
            self.stdout.write(f'Indexando {app}.{model}...')
            count = indexer.index_model(app, model, limit=limit)
            self.stdout.write(self.style.SUCCESS(f'✅ {count} registros indexados'))
        
        elif app:
            # Indexar todos los modelos de una app
            if app not in indexer.MODELS_TO_INDEX:
                self.stdout.write(self.style.ERROR(f'❌ App {app} no configurada para indexación'))
                return
            
            total = 0
            for model_name in indexer.MODELS_TO_INDEX[app].keys():
                self.stdout.write(f'Indexando {app}.{model_name}...')
                count = indexer.index_model(app, model_name, limit=limit)
                self.stdout.write(self.style.SUCCESS(f'  ✅ {count} registros'))
                total += count
            
            self.stdout.write(self.style.SUCCESS(f'\n✅ Total: {total} registros indexados'))
        
        else:
            # Indexar todo
            self.stdout.write('Indexando todos los modelos configurados...\n')
            total = indexer.index_all(limit_per_model=limit)
            self.stdout.write(self.style.SUCCESS(f'\n✅ Total: {total} registros indexados'))
        
        self.stdout.write(self.style.SUCCESS('\n🎉 Indexación completada'))
