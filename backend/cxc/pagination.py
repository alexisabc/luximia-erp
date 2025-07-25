# backend/api/pagination.py

from rest_framework.pagination import PageNumberPagination


class CustomPagination(PageNumberPagination):
    # El nombre del parámetro en la URL que el frontend usará para definir el tamaño.
    # Ejemplo: /api/clientes/?page_size=8
    page_size_query_param = 'page_size'

    # Un límite máximo para evitar que alguien pida un millón de registros de golpe.
    max_page_size = 100
