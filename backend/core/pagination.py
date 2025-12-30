from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CustomPagination(PageNumberPagination):
    """
    Paginación estándar optimizada para el proyecto ERP.
    Características:
    - Default: 10 items.
    - Cliente: Puede solicitar hasta 100 items con ?page_size=N.
    - Metadatos: Incluye total_pages y current_page para facilitar UI.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,          # Total registros
            'total_pages': self.page.paginator.num_pages,# Total páginas
            'current_page': self.page.number,            # Página actual
            'next': self.get_next_link(),                # Link siguiente
            'previous': self.get_previous_link(),        # Link anterior
            'results': data                              # Datos
        })
