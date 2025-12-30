from io import BytesIO
from django.template.loader import render_to_string
try:
    from xhtml2pdf import pisa
except ImportError:
    pisa = None

class NominaPDFService:
    @staticmethod
    def generar_pdf(recibo):
        """
        Generates PDF bytes for a ReciboNomina using `xhtml2pdf`.
        """
        if pisa is None:
            raise ImportError("xhtml2pdf libreria no instalada.")

        template_path = 'rrhh/recibo_nomina.html'
        context = {'recibo': recibo}
        html_string = render_to_string(template_path, context)
        
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html_string.encode("UTF-8")), result)
        
        if pdf.err:
            raise Exception(f"Error generating PDF: {pdf.err}")
            
        return result.getvalue()
