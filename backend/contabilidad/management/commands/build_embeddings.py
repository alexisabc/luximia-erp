from django.core.management.base import BaseCommand
from django.db import OperationalError

from contabilidad.rag import index_documents


class Command(BaseCommand):
    help = "Genera y almacena las incrustaciones de documentos en pgvector"

    def handle(self, *args, **options):
        try:
            count = index_documents()
        except OperationalError as exc:
            self.stderr.write(self.style.ERROR(f"Error de base de datos: {exc}"))
            return
        self.stdout.write(self.style.SUCCESS(f"Indexados {count} documentos"))
