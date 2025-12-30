import threading

# Thread-local storage para almacenar el contexto de la petición
_thread_locals = threading.local()


def get_current_user():
    """Obtiene el usuario actual del contexto de la petición."""
    return getattr(_thread_locals, 'user', None)


def get_current_request():
    """Obtiene la petición actual del contexto."""
    return getattr(_thread_locals, 'request', None)


def get_client_ip(request=None):
    """Obtiene la IP del cliente de la petición."""
    if request is None:
        request = get_current_request()
    
    if request is None:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    
    return ip


def get_user_agent(request=None):
    """Obtiene el User-Agent del cliente."""
    if request is None:
        request = get_current_request()
    
    if request is None:
        return None
    
    return request.META.get('HTTP_USER_AGENT', '')


class AuditMiddleware:
    """
    Middleware para capturar el contexto de la petición (usuario, IP, user-agent)
    y almacenarlo en thread-local storage para que esté disponible en signals.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Almacenar el request y el usuario en thread-local
        _thread_locals.request = request
        _thread_locals.user = getattr(request, 'user', None)
        
        try:
            response = self.get_response(request)
        finally:
            # Limpiar el thread-local después de procesar la petición
            if hasattr(_thread_locals, 'request'):
                del _thread_locals.request
            if hasattr(_thread_locals, 'user'):
                del _thread_locals.user
        
        return response
