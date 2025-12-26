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
        # INTENTO 1: Ver si ya podemos conectarnos (ya existe y es accesible)
        try:
            # Extraer opciones adicionales (como SSL) para la conexión directa
            connect_kwargs = {
                'dbname': db_name,
                'user': db_user,
                'password': db_pass,
                'host': db_host,
                'port': db_port,
            }
            # En producción, settings de Django usa 'OPTIONS' para SSL
            if sandbox_db.get('OPTIONS'):
                # Simplificación básica para psycopg2
                ssl_mode = sandbox_db['OPTIONS'].get('sslmode')
                if ssl_mode:
                    connect_kwargs['sslmode'] = ssl_mode

            conn_test = psycopg2.connect(**connect_kwargs)
            conn_test.close()
            self.stdout.write(self.style.SUCCESS(f"ℹ️  La base de datos Sandbox '{db_name}' ya existe y es accesible."))
            exists = True
        except Exception:
            exists = False

        if not exists:
            # INTENTO 2: Intentar crearla conectándose a la DB administrativa 'postgres'
            # Esto suele funcionar en desarrollo local/Docker, pero falla en Cloud Managed DBs.
            self.stdout.write(f"🟡 Intentando crear base de datos Sandbox: {db_name}...")
            default_db_conf = settings.DATABASES[DEFAULT_DB_ALIAS]
            
            try:
                # Nota: En Cloud, a veces no puedes conectar a 'postgres'. 
                # Intentamos usar la base de datos default como puente si no es 'postgres'.
                admin_db = 'postgres'
                
                conn = psycopg2.connect(
                    dbname=admin_db,
                    user=default_db_conf['USER'],
                    password=default_db_conf['PASSWORD'],
                    host=default_db_conf['HOST'],
                    port=default_db_conf['PORT']
                )
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cur = conn.cursor()
                
                # Verificar si existe (por seguridad, aunque el test de arriba falló)
                cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                if not cur.fetchone():
                    cur.execute(f'CREATE DATABASE "{db_name}" OWNER "{db_user}";')
                    self.stdout.write(self.style.SUCCESS(f"✅ Base de datos {db_name} creada exitosamente."))
                else:
                    self.stdout.write(f"ℹ️  La base de datos {db_name} ya existía en el servidor.")
                
                cur.close()
                conn.close()

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠️  No se pudo crear la DB '{db_name}' automáticamente: {e}"))
                self.stdout.write("   (Esto es normal en entornos Cloud si la base de datos no fue pre-creada)")

        if exists:
            # 2. Ejecutar Migraciones en Sandbox
            self.stdout.write("🔄 Aplicando migraciones a Sandbox...")
            try:
                # Primero migrar IA para instalar extensión 'vector' y evitar errores de dependencias
                self.stdout.write("   -> Migrando app 'ia' (instala vector extension)...")
                call_command('migrate', 'ia', database='sandbox', interactive=False)
                
                # Luego migrar el resto
                self.stdout.write("   -> Aplicando resto de migraciones...")
                call_command('migrate', database='sandbox', interactive=False)
                
                self.stdout.write(self.style.SUCCESS("✅ Migraciones de Sandbox aplicadas correctamente."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error migrando Sandbox: {e}"))
        else:
             self.stdout.write(self.style.WARNING("⚠️  Saltando migraciones de Sandbox porque la base de datos no existe."))

        # 3. Crear Superusuario para Sandbox si es necesario (Opcional, clonando del default)
        # Esto es complejo de automatizar sin inputs, mejor dejar que el usuario lo cree o usar un script de seed comun.
