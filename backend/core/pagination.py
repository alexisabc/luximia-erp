from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    """
    Paginación estándar para todo el proyecto.
    Permite al cliente definir el tamaño de página con ?page_size=X
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
