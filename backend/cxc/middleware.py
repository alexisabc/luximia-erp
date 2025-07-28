from django.conf import settings


class SecurityHeadersMiddleware:
    """Agrega encabezados de seguridad básicos."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        csp = getattr(settings, 'CONTENT_SECURITY_POLICY', "default-src 'self'")
        permissions = getattr(settings, 'PERMISSIONS_POLICY', 'geolocation=()')
        response['Content-Security-Policy'] = csp
        response['Permissions-Policy'] = permissions
        return response
