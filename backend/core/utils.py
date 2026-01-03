import os
from django.conf import settings

def get_logo_path():
    """Devuelve la ruta absoluta al logo corporativo global."""
    return os.path.join(settings.ASSETS_PATH, "logo-sistema.png")
