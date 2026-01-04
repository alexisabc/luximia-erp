from decimal import Decimal
from django.core.exceptions import ValidationError
from obras.models import PartidaPresupuestal

class ValidacionPresupuestalService:
    @staticmethod
    def validar_presupuesto(partida: PartidaPresupuestal, monto_a_gastar: Decimal, user=None):
        """
        Calcula si hay presupuesto disponible.
        Lanza ValidationError si no alcanza.
        Permite override si el usuario tiene permiso 'compras.aprobar_sobrecosto'.
        """
        # Asegurar tipo Decimal
        monto_a_gastar = Decimal(str(monto_a_gastar))
        disponible = partida.disponible
        
        if monto_a_gastar > disponible:
            # Check permissions for override
            if user and user.has_perm('compras.aprobar_sobrecosto'):
                return True # Autorizado por Director/Gerente
            
            # Default: Block
            faltante = monto_a_gastar - disponible
            raise ValidationError(
                f"Excede presupuesto en partida '{partida.centro_costo.nombre} - {partida.categoria}' "
                f"por ${faltante:,.2f} MXN. Disponible: ${disponible:,.2f} MXN"
            )
        return True
