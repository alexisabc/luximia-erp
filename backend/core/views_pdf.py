from rest_framework.views import APIView
from django.http import HttpResponse
from .services.pdf_service import PDFService
from rest_framework.permissions import IsAuthenticated, AllowAny

class PDFTestView(APIView):
    # AllowAny solo para prueba rápida, cambiar a IsAuthenticated en producción
    permission_classes = [AllowAny] 
    
    def get(self, request):
        pdf_bytes = PDFService.generate_pdf('reports/test_pdf.html')
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        # 'inline' opens in browser, 'attachment' downloads
        response['Content-Disposition'] = 'inline; filename="prueba.pdf"'
        return response
