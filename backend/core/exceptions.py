from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Handler global de excepciones para estandarizar respuestas de error JSON.
    Convierte cualquier error en una estructura predecible:
    {
        "status": "error",
        "code": 400,
        "detail": "Mensaje legible para usuario",
        "errors": { ...detalles técnicos o por campo... }
    }
    """
    # Llama al handler por defecto de DRF primero
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "status": "error",
            "code": response.status_code,
            "detail": "Ha ocurrido un error en la solicitud.",
            "errors": None
        }

        # Extraer mensaje principal si existe
        if "detail" in response.data:
            custom_data["detail"] = response.data["detail"]
            del response.data["detail"]
        
        # El resto de datos son errores de campo
        if response.data:
            custom_data["errors"] = response.data
            
            # Si hay un solo error en errores y no hay detail claro, úsalo como detail
            if isinstance(response.data, list):
                 custom_data["detail"] = response.data[0]
            elif isinstance(response.data, dict) and len(response.data) == 1:
                key = next(iter(response.data))
                val = response.data[key]
                if isinstance(val, list):
                    custom_data["detail"] = f"{key}: {val[0]}"
                else:
                    custom_data["detail"] = f"{key}: {str(val)}"

        response.data = custom_data

    return response
