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

def get_current_company_id():
    """Retorna el ID de la empresa activa en el hilo actual."""
    return getattr(_thread_locals, 'company_id', None)

def set_current_company_id(company_id):
    """Establece el ID de la empresa activa para el filtrado automático."""
    _thread_locals.company_id = company_id

def set_sandbox_mode(is_sandbox):
    """Establece el modo sandbox global para el hilo actual."""
    _thread_locals.is_sandbox = is_sandbox

class ThreadLocalMiddleware:
    """
    Middleware para almacenar el usuario y contexto (Sandbox) actual en thread-local storage.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        
        # Detectar Entorno (Sandbox vs Prod)
        set_sandbox_mode(request.headers.get('X-Environment', 'prod').lower() == 'sandbox')
        is_sandbox = is_sandbox_mode()
        
        # Guardar Empresa Actual en ThreadLocal para filtrado automático
        # El ID viene del Middleware de Empresa o del Header directly
        _thread_locals.company_id = None 
        
        # Inyectar atributos en request para uso fácil en views
        request.is_sandbox = is_sandbox

        try:
            response = self.get_response(request)
            
            # (Opcional) header de respuesta para confirmar modo
            if is_sandbox:
                response['X-Sandbox-Enforced'] = 'True'
                
        finally:
            _thread_locals.user = None
            _thread_locals.is_sandbox = False
            _thread_locals.company_id = None
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
        # Limpiar cualquier residuo de hilos previos (aunque el middleware previo lo limpia)
        set_current_company_id(None)
        
        if request.user.is_authenticated:
            # Prioridad 0: Header explícito X-Company-ID (Usado por el Frontend)
            header_company_id = request.headers.get('X-Company-ID')
            
            # Prioridad 1: Empresa guardada en BD (Persistencia real del usuario)
            db_company_id = request.user.ultima_empresa_activa_id
            
            # Decidir qué ID usar
            target_company_id = header_company_id or db_company_id
            
            # Si no hay ID, intentar empresa principal
            if not target_company_id:
                target_company_id = request.user.empresa_principal_id
            
            # Si sigue sin haber ID, usar la primera disponible
            if not target_company_id:
                first_emp = request.user.empresas_acceso.first()
                if first_emp:
                    target_company_id = first_emp.id

            if target_company_id:
                # Validación de seguridad: ¿Tiene el usuario acceso a esta empresa?
                # Cacheamos el objeto Empresa en el request
                try:
                    # Si es superusuario, saltar validación de ManyToMany
                    if request.user.is_superuser:
                        from core.models import Empresa
                        empresa = Empresa.objects.get(id=target_company_id)
                        has_access = True
                    else:
                        empresa = request.user.empresas.get(id=target_company_id)
                        has_access = True
                except:
                    empresa = None
                    has_access = False

                if has_access and empresa:
                    request.empresa = empresa
                    set_current_company_id(empresa.id)
                    
                    # Sincronizar persistencia del usuario si cambió
                    if request.user.ultima_empresa_activa_id != empresa.id:
                        request.user.ultima_empresa_activa = empresa
                        request.user.save(update_fields=['ultima_empresa_activa'])
        
        response = self.get_response(request)
        return response
