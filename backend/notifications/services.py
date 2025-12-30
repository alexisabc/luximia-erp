from .models import Notificacion

class NotificacionService:
    """
    Servicio centralizado para la gestión de notificaciones.
    """
    
    @staticmethod
    def crear_notificacion(usuario_id, titulo, mensaje, tipo='INFO', link=None):
        """
        Crea una nueva notificación para un usuario específico en la base de datos.
        """
        return Notificacion.objects.create(
            usuario_id=usuario_id,
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo,
            link=link
        )

    @staticmethod
    def marcar_como_leida(usuario_id, notificacion_ids='all'):
        """
        Marca notificaciones como leídas para un usuario.
        """
        qs = Notificacion.objects.filter(usuario_id=usuario_id, leida=False)
        
        if notificacion_ids != 'all':
            if isinstance(notificacion_ids, list):
                qs = qs.filter(id__in=notificacion_ids)
            else:
                qs = qs.filter(id=notificacion_ids)
        
        return qs.update(leida=True)

    @staticmethod
    def obtener_conteo_no_leidas(usuario_id):
        """
        Retorna la cantidad de notificaciones no leídas de un usuario.
        """
        return Notificacion.objects.filter(usuario_id=usuario_id, leida=False).count()
