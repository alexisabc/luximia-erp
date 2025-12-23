from core.middleware import is_sandbox_mode

class SandboxRouter:
    """
    Router para redirigir operaciones a la base de datos 'sandbox'
    cuando se detecta el flag global de sandbox mode.
    """
    
    def db_for_read(self, model, **hints):
        if is_sandbox_mode():
            return 'sandbox'
        return None

    def db_for_write(self, model, **hints):
        if is_sandbox_mode():
            return 'sandbox'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Permitir relaciones si ambos objetos están en la misma DB.
        """
        if obj1._state.db == obj2._state.db:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Permitir migraciones en ambas DBs, pero asegurarse de que
        'sandbox' reciba la estructura completa.
        """
        return True
