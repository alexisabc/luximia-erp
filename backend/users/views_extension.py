
class ResetUserSessionView(APIView):
    """
    Fuerza el cierre de sesión de un usuario rotando su token_version.
    """
    permission_classes = [IsStaffOrSuperuser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            # Rotar version
            user.token_version = uuid.uuid4()
            user.save()
            
            logger.info(f"Sesión reseteada para usuario {user.email} por admin {request.user.email}")
            return Response({"detail": "Sesión cerrada correctamente. El usuario deberá ingresar nuevamente."})
        except User.DoesNotExist:
             return Response({"detail": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
