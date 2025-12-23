from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connections, DEFAULT_DB_ALIAS
from django.core.management import call_command
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

class Command(BaseCommand):
    help = "Inicializa el entorno Sandbox: crea la DB si no existe y ejecuta migraciones."

    def handle(self, *args, **options):
        sandbox_db = settings.DATABASES.get('sandbox')
        if not sandbox_db:
            self.stdout.write(self.style.ERROR("❌ No se encontró configuración para la base de datos 'sandbox'."))
            return

        db_name = sandbox_db['NAME']
        db_user = sandbox_db['USER']
        db_pass = sandbox_db['PASSWORD']
        db_host = sandbox_db['HOST']
        db_port = sandbox_db['PORT']

        # 1. Crear la Base de Datos si no existe
        # Nos conectamos a la DB 'postgres' (default) para poder crear otras DBs
        default_db_conf = settings.DATABASES[DEFAULT_DB_ALIAS]
        
        try:
            conn = psycopg2.connect(
                dbname='postgres',
                user=default_db_conf['USER'],
                password=default_db_conf['PASSWORD'],
                host=default_db_conf['HOST'],
                port=default_db_conf['PORT']
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()
            
            # Verificar si existe
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone()
            
            if not exists:
                self.stdout.write(f"🟡 Creando base de datos Sandbox: {db_name}...")
                cur.execute(f'CREATE DATABASE "{db_name}" OWNER "{db_user}";')
                self.stdout.write(self.style.SUCCESS(f"✅ Base de datos {db_name} creada exitosamente."))
            else:
                self.stdout.write(f"ℹ️  La base de datos Sandbox {db_name} ya existe.")
            
            cur.close()
            conn.close()

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error verificando/creando Sandbox DB: {e}"))
            # No retornamos, intentamos migrar por si acaso ya existe y el error fue otro

        # 2. Ejecutar Migraciones en Sandbox
        self.stdout.write("🔄 Aplicando migraciones a Sandbox...")
        try:
            call_command('migrate', database='sandbox', interactive=False)
            self.stdout.write(self.style.SUCCESS("✅ Migraciones de Sandbox aplicadas correctamente."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error migrando Sandbox: {e}"))

        # 3. Crear Superusuario para Sandbox si es necesario (Opcional, clonando del default)
        # Esto es complejo de automatizar sin inputs, mejor dejar que el usuario lo cree o usar un script de seed comun.
