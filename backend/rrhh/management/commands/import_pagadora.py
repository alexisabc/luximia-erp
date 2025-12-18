
import os
from django.core.management.base import BaseCommand
from rrhh.services import NominaImporter

class Command(BaseCommand):
    help = 'Importa nóminas históricas (no fiscales) desde Excel con formato variable.'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Ruta al archivo Excel (.xlsx)')
        parser.add_argument('--dry-run', action='store_true', help='Simular sin guardar cambios')
        parser.add_argument('--anio', type=int, default=2025, help='Año para las nóminas (si no se detecta)')

    def handle(self, *args, **options):
        file_path = options['file_path']
        dry_run = options['dry_run']
        anio = options['anio']

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"Archivo no encontrado: {file_path}"))
            return

        importer = NominaImporter(stdout=self.stdout)
        importer.process_file(file_path, anio=anio, dry_run=dry_run)

