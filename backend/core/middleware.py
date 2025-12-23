import threading
from django.apps import apps

_thread_locals = threading.local()

def get_current_user():
    """
    Retorna el usuario actual del request, o None si no hay contexto.
    """
    return getattr(_thread_locals, 'user', None)

def is_sandbox_mode():
    """Retorna True si el contexto actual es Sandbox."""
    return getattr(_thread_locals, 'is_sandbox', False)

class ThreadLocalMiddleware:
    """
    Middleware para almacenar el usuario y contexto (Sandbox) actual en thread-local storage.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        
        # Detectar Header de Sandbox
        is_sandbox = request.headers.get('X-Sandbox-Mode', 'false').lower() == 'true'
        _thread_locals.is_sandbox = is_sandbox
        
        # Inyectar atributo en request para uso fácil en views
        request.is_sandbox = is_sandbox

        try:
            response = self.get_response(request)
            
            # (Opcional) header de respuesta para confirmar modo
            if is_sandbox:
                response['X-Sandbox-Enforced'] = 'True'
                
        finally:
            _thread_locals.user = None
            _thread_locals.is_sandbox = False
        return response


class EmpresaMiddleware:
    """
    Middleware que asegura que cada request tenga una empresa activa.
    La empresa se almacena en la sesión del usuario y se carga en request.empresa
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.empresa = None
        
        if request.user.is_authenticated:
            # Prioridad 1: Empresa guardada en BD (Persistencia real)
            empresa = request.user.ultima_empresa_activa
            
            # Prioridad 2: Empresa principal
            if not empresa:
                empresa = request.user.empresa_principal
                
            # Prioridad 3: Primera empresa con acceso
            if not empresa:
                empresa = request.user.empresas_acceso.first()

            # Validación de seguridad y asignación
            if empresa:
                has_access = False
                
                # Check jerárquico de permisos
                if request.user.is_superuser:
                    has_access = True
                elif request.user.empresa_principal_id == empresa.id:
                    has_access = True
                elif request.user.empresas_acceso.filter(id=empresa.id).exists():
                    has_access = True
                
                if has_access:
                    request.empresa = empresa
                    
                    # Sincronizar sesión
                    if request.session.get('empresa_id') != empresa.id:
                        request.session['empresa_id'] = empresa.id
                else:
                    # Si tiene una empresa asignada pero ya no tiene permiso, limpiarla
                    if request.user.ultima_empresa_activa:
                        request.user.ultima_empresa_activa = None
                        request.user.save(update_fields=['ultima_empresa_activa'])
        
        response = self.get_response(request)
        return response
