from django.http import JsonResponse


def home(request):
    """Simple root view to avoid 404 warnings."""
    return JsonResponse({"message": "Luximia ERP API", "api": "/api/"})
