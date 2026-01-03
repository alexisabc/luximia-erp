from rest_framework import viewsets, status, permissions, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import pyotp
from decimal import Decimal

from core.permissions import HasPermissionForAction
from .models import (
    Producto, Caja, Turno, Venta, DetalleVenta, 
    CuentaCliente, MovimientoSaldoCliente, MovimientoCaja
)
from .serializers import (
    ProductoSerializer, CajaSerializer, TurnoSerializer, 
    VentaSerializer, VentaCancelacionSerializer,
    CuentaClienteSerializer, PagoCuentaSerializer,
    MovimientoSaldoClienteSerializer
)
from contabilidad.models import Cliente

User = get_user_model()

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'], url_path='productos-fast')
    def productos_fast(self, request):
        """
        Retorna listado optimizado para caché offline (IndexDB).
        """
        productos = self.get_queryset().filter(deleted_at__isnull=True)
        data = []
        for p in productos:
            item = {
                'id': p.id,
                'nombre': p.nombre,
                'barcode': p.codigo,
                'precio': float(p.precio_final),
                'impuesto': float(p.impuestos_porcentaje),
                'unidad': p.unidad_medida,
                'search_terms': f"{p.nombre} {p.codigo}".lower()
            }
            if hasattr(p, 'stock_actual'):
                item['stock'] = float(p.stock_actual)
            
            data.append(item)
        return Response(data)

class CajaViewSet(viewsets.ModelViewSet):
    queryset = Caja.objects.all()
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all().order_by('-fecha_inicio')
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['post'])
    def abrir(self, request):
        usuario = request.user
        caja_id = request.data.get('caja')
        saldo_inicial = request.data.get('saldo_inicial', 0)
        
        # Validar si ya tiene turno abierto
        if Turno.objects.filter(usuario=usuario, cerrado=False).exists():
            return Response({"detail": "Ya tienes un turno abierto."}, status=400)
            
        caja = get_object_or_404(Caja, pk=caja_id)
        turno = Turno.objects.create(
            caja=caja,
            usuario=usuario,
            saldo_inicial=saldo_inicial
        )
        return Response(TurnoSerializer(turno).data)

    @decorators.action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        turno = self.get_object()
        if turno.cerrado:
            return Response({"detail": "El turno ya está cerrado."}, status=400)
            
        declarado = Decimal(str(request.data.get('saldo_declarado', 0)))
        
        # Calcular saldo final teórico
        # Saldo Inicial + Ventas Efectivo + Ingresos Caja - Retiros Caja
        ventas_efectivo = Venta.objects.filter(
            turno=turno, 
            estado='PAGADA', 
            metodo_pago_principal='EFECTIVO'
        ).aggregate(total=models.Sum('total'))['total'] or 0

        # Ingresos/Retiros por MovimientoCaja (ej. Abonos)
        ingresos = MovimientoCaja.objects.filter(turno=turno, tipo='INGRESO').aggregate(total=models.Sum('monto'))['total'] or 0
        retiros = MovimientoCaja.objects.filter(turno=turno, tipo='RETIRO').aggregate(total=models.Sum('monto'))['total'] or 0

        calculado = turno.saldo_inicial + ventas_efectivo + ingresos - retiros
        
        turno.saldo_final_calculado = calculado
        turno.saldo_final_declarado = declarado
        turno.diferencia = declarado - calculado
        turno.cerrado = True
        turno.fecha_fin = timezone.now()
        turno.save()
        
        return Response(TurnoSerializer(turno).data)

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha')
    serializer_class = VentaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Crea una venta delegando toda la lógica de negocio al servicio.
        """
        from .services.venta_service import VentaService
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idata = serializer.validated_data
        
        # Extraer datos de la request
        items = request.data.get('items', [])
        turno = idata.get('turno')
        cliente = idata.get('cliente')
        metodo_principal = idata.get('metodo_pago_principal')
        metodo_secundario = request.data.get('metodo_pago_secundario')
        monto_principal = request.data.get('monto_metodo_principal')
        monto_secundario = request.data.get('monto_metodo_secundario')
        
        try:
            # Delegar al servicio
            venta = VentaService.crear_venta_pos(
                turno=turno,
                items=items,
                metodo_principal=metodo_principal,
                cliente=cliente,
                metodo_secundario=metodo_secundario,
                monto_principal=monto_principal,
                monto_secundario=monto_secundario
            )
            
            # Retornar respuesta
            serializer = self.get_serializer(venta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @decorators.action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancela una venta con autorización de supervisor vía TOTP.
        Delega la lógica de cancelación al servicio.
        """
        from .services.venta_service import VentaService
        
        venta = self.get_object()
        
        # Autenticación Supervisor
        sup_user = request.data.get('supervisor_username')
        sup_code = request.data.get('supervisor_code')
        motivo = request.data.get('motivo')
        
        try:
            supervisor = User.objects.get(username=sup_user, is_active=True)
            
            if not supervisor.is_staff:
                return Response(
                    {"detail": "Usuario no autorizado para supervisar"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not supervisor.totp_secret:
                return Response(
                    {"detail": "Supervisor sin TOTP configurado"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            totp = pyotp.TOTP(supervisor.totp_secret)
            if not totp.verify(sup_code, valid_window=1):
                return Response(
                    {"detail": "Código TOTP inválido"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        except User.DoesNotExist:
            return Response(
                {"detail": "Supervisor no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delegar cancelación al servicio
        try:
            VentaService.cancelar_venta(venta, supervisor, motivo)
            return Response({"detail": "Venta cancelada exitosamente"})
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CuentaClienteViewSet(viewsets.ModelViewSet):
    queryset = CuentaCliente.objects.all()
    serializer_class = CuentaClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['post'])
    def abonar(self, request):
        """
        Registra un pago del cliente (Abono).
        Delega la lógica al servicio.
        """
        from .services.cuenta_cliente_service import CuentaClienteService
        
        serializer = PagoCuentaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        try:
            resultado = CuentaClienteService.registrar_abono(
                cliente_id=data['cliente_id'],
                monto=data['monto'],
                forma_pago=data['forma_pago'],
                turno_id=data.get('turno_id'),
                comentarios=data.get('comentarios', '')
            )
            return Response(resultado)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @decorators.action(detail=True, methods=['get'])
    def estado_cuenta(self, request, pk=None):
        """Reporte personalizado historial."""
        cuenta = self.get_object()
        movimientos = MovimientoSaldoCliente.objects.filter(cuenta=cuenta).order_by('-created_at')[:50]
        return Response(MovimientoSaldoClienteSerializer(movimientos, many=True).data)


# ============= SISTEMA DE CANCELACIONES CON AUTORIZACIÓN =============

from django.utils import timezone
from rest_framework.views import APIView
from .models import SolicitudCancelacion
from .serializers import (
    SolicitudCancelacionSerializer,
    CrearSolicitudCancelacionSerializer,
    AutorizarCancelacionSerializer,
    RechazarCancelacionSerializer
)


def get_client_ip(request):
    """Obtiene la IP del cliente de la request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class SolicitudCancelacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar solicitudes de cancelación.
    - Cajeros pueden crear solicitudes
    - Supervisores pueden aprobar/rechazar
    """
    queryset = SolicitudCancelacion.objects.all()
    serializer_class = SolicitudCancelacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtra según el tipo de usuario y parámetros."""
        qs = super().get_queryset()
        
        # Filtrar por estado
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        
        # Si no es staff, solo ver sus propias solicitudes
        if not self.request.user.is_staff and not self.request.user.has_perm('pos.authorize_cancellation'):
            qs = qs.filter(solicitante=self.request.user)
        
        return qs


class SolicitarCancelacionView(APIView):
    """
    Vista para que un cajero solicite la cancelación de un ticket.
    POST: Crea una solicitud de cancelación pendiente de aprobación.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = CrearSolicitudCancelacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        venta_id = serializer.validated_data['venta_id']
        motivo = serializer.validated_data['motivo']
        
        venta = Venta.objects.get(pk=venta_id)
        
        # Obtener turno activo del usuario si existe
        turno_activo = Turno.objects.filter(
            usuario=request.user, 
            cerrado=False
        ).first()
        
        # Crear solicitud
        solicitud = SolicitudCancelacion.objects.create(
            venta=venta,
            solicitante=request.user,
            motivo=motivo,
            turno=turno_activo,
            ip_solicitante=get_client_ip(request)
        )
        
        return Response({
            "detail": "Solicitud de cancelación creada. Pendiente de autorización.",
            "solicitud_id": solicitud.id,
            "estado": solicitud.estado
        }, status=status.HTTP_201_CREATED)


class CancelacionesPendientesView(APIView):
    """
    Vista para que supervisores vean las cancelaciones pendientes.
    GET: Lista todas las cancelaciones pendientes de aprobación.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Verificar permiso
        if not request.user.is_staff and not request.user.has_perm('pos.authorize_cancellation'):
            return Response({
                "detail": "No tienes permiso para ver cancelaciones pendientes."
            }, status=status.HTTP_403_FORBIDDEN)
        
        pendientes = SolicitudCancelacion.objects.filter(
            estado='PENDIENTE'
        ).order_by('-fecha_solicitud')
        
        serializer = SolicitudCancelacionSerializer(pendientes, many=True)
        return Response({
            "count": pendientes.count(),
            "results": serializer.data
        })


class AutorizarCancelacionView(APIView):
    """
    Vista para que un supervisor autorice una cancelación.
    POST: Valida el código TOTP y aprueba la cancelación.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        # Verificar permiso
        if not request.user.is_staff and not request.user.has_perm('pos.authorize_cancellation'):
            return Response({
                "detail": "No tienes permiso para autorizar cancelaciones."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener solicitud
        solicitud = get_object_or_404(SolicitudCancelacion, pk=pk)
        
        if solicitud.estado != 'PENDIENTE':
            return Response({
                "detail": f"Esta solicitud ya fue {solicitud.estado.lower()}."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar datos
        serializer = AutorizarCancelacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        codigo = serializer.validated_data['codigo_autorizacion']
        comentarios = serializer.validated_data.get('comentarios', '')
        
        # Verificar TOTP de autorización
        supervisor = request.user
        
        # Usar el TOTP de autorización si está configurado, sino el de login
        totp_secret = supervisor.totp_authorization_secret or supervisor.totp_secret
        
        if not totp_secret:
            return Response({
                "detail": "No tienes configurado un código de autorización. Configúralo en tu perfil."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(totp_secret)
        if not totp.verify(codigo, valid_window=1):
            return Response({
                "detail": "Código de autorización inválido."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Aprobar la cancelación y delegar reversión al servicio
        from .services.venta_service import VentaService
        
        try:
            solicitud.aprobar(
                autorizador=supervisor,
                ip=get_client_ip(request),
                comentarios=comentarios
            )
            
            # Delegar reversión de movimientos al servicio
            VentaService.autorizar_cancelacion_solicitud(solicitud, supervisor)
            
            venta = solicitud.venta
            return Response({
                "detail": f"Cancelación del ticket {venta.folio} autorizada exitosamente.",
                "venta_folio": venta.folio,
                "autorizado_por": supervisor.username,
                "fecha_autorizacion": solicitud.fecha_autorizacion
            })
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RechazarCancelacionView(APIView):
    """
    Vista para que un supervisor rechace una cancelación.
    POST: Marca la solicitud como rechazada.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        # Verificar permiso
        if not request.user.is_staff and not request.user.has_perm('pos.authorize_cancellation'):
            return Response({
                "detail": "No tienes permiso para rechazar cancelaciones."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener solicitud
        solicitud = get_object_or_404(SolicitudCancelacion, pk=pk)
        
        if solicitud.estado != 'PENDIENTE':
            return Response({
                "detail": f"Esta solicitud ya fue {solicitud.estado.lower()}."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar datos
        serializer = RechazarCancelacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        comentarios = serializer.validated_data['comentarios']
        
        # Rechazar la solicitud
        solicitud.rechazar(
            autorizador=request.user,
            ip=get_client_ip(request),
            comentarios=comentarios
        )
        
        return Response({
            "detail": f"Solicitud de cancelación rechazada.",
            "venta_folio": solicitud.venta.folio,
            "rechazado_por": request.user.username
        })


class ConfigurarTOTPAutorizacionView(APIView):
    """
    Vista para que un usuario configure su TOTP de autorización.
    GET: Genera un nuevo secreto y retorna el QR code.
    POST: Verifica el código y activa el TOTP de autorización.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Genera un nuevo secreto TOTP para autorización."""
        import base64
        import qrcode
        from io import BytesIO
        
        user = request.user
        
        # Generar nuevo secreto
        secret = pyotp.random_base32()
        
        # Guardar temporalmente (sin activar)
        user.totp_authorization_secret = secret
        user.totp_authorization_configured = False
        user.save()
        
        # Generar URI para QR
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(
            name=user.username,
            issuer_name="ERP-Autorizaciones"
        )
        
        # Generar QR como base64
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "uri": uri,
            "message": "Escanea el código QR con tu app autenticadora y luego verifica con un código."
        })
    
    def post(self, request):
        """Verifica y activa el TOTP de autorización."""
        codigo = request.data.get('codigo')
        
        if not codigo:
            return Response({
                "detail": "Código requerido."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        if not user.totp_authorization_secret:
            return Response({
                "detail": "Primero genera un nuevo secreto usando GET."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(user.totp_authorization_secret)
        if totp.verify(codigo, valid_window=1):
            user.totp_authorization_configured = True
            user.save()
            
            return Response({
                "detail": "TOTP de autorización configurado exitosamente.",
                "configured": True
            })
        else:
            return Response({
                "detail": "Código inválido. Intenta de nuevo."
            }, status=status.HTTP_400_BAD_REQUEST)
