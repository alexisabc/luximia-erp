import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connections

def fix():
    try:
        print("Attempting to enable 'vector' extension on sandbox database...")
        with connections['sandbox'].cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("SUCCESS: 'vector' extension enabled.")
    except Exception as e:
        print(f"FAILURE: {e}")

if __name__ == '__main__':
    fix()
