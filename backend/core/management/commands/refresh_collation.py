from django.core.management.base import BaseCommand
from django.db import connections, DEFAULT_DB_ALIAS
from django.conf import settings
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

class Command(BaseCommand):
    help = "Refresca la versión de la colación en las bases de datos para resolver advertencias de mismatch."

    def handle(self, *args, **options):
        # 1. Lista de bases de datos registradas en Django
        for db_alias in settings.DATABASES:
            conf = settings.DATABASES[db_alias]
            db_name = conf.get('NAME')
            
            self.stdout.write(f"🟡 Intentando refrescar colación en alias '{db_alias}' (DB: {db_name})...")
            
            try:
                # Usamos una conexión directa con psycopg2
                connect_kwargs = {
                    'dbname': db_name,
                    'user': conf.get('USER'),
                    'password': conf.get('PASSWORD'),
                    'host': conf.get('HOST'),
                    'port': conf.get('PORT')
                }
                
                # Soportar SSL en producción
                if conf.get('OPTIONS'):
                    ssl_mode = conf['OPTIONS'].get('sslmode')
                    if ssl_mode:
                        connect_kwargs['sslmode'] = ssl_mode

                conn = psycopg2.connect(**connect_kwargs)
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cur = conn.cursor()
                
                # 2. Refrescar la base de datos actual
                cur.execute(f'ALTER DATABASE "{db_name}" REFRESH COLLATION VERSION;')
                self.stdout.write(self.style.SUCCESS(f"   ✅ Colación refrescada en '{db_name}'."))
                
                # 3. Intentar refrescar 'postgres' (opcional)
                # Solo lo intentamos una vez, generalmente cuando estamos en el alias default
                if db_alias == DEFAULT_DB_ALIAS and db_name != 'postgres':
                    try:
                        cur.execute('ALTER DATABASE postgres REFRESH COLLATION VERSION;')
                        self.stdout.write(self.style.SUCCESS("   ✅ Colación refrescada en 'postgres'."))
                    except Exception:
                        # Si falla es normal si no somos superusuarios
                        pass
                
                cur.close()
                conn.close()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error refrescando colación en alias {db_alias}: {e}"))
