from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Banco, Proyecto, UPE, Cliente, Pago, Moneda, Departamento, Puesto, Empleado, Presupuesto,  MetodoPago

from .serializers import (
    BancoSerializer,
    ProyectoSerializer,
    UPESerializer,
    ClienteSerializer,
    PagoSerializer,
    MonedaSerializer,
    DepartamentoSerializer,
    PuestoSerializer,
    EmpleadoSerializer,
    PresupuestoSerializer,
    MetodoPagoSerializer,

)


class BancoViewSet(viewsets.ModelViewSet):
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer
    permission_classes = [AllowAny]


class ProyectoViewSet(viewsets.ModelViewSet):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
    permission_classes = [AllowAny]


class UPEViewSet(viewsets.ModelViewSet):
    queryset = UPE.objects.all()
    serializer_class = UPESerializer
    permission_classes = [AllowAny]


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [AllowAny]


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer
    permission_classes = [AllowAny]


class MonedaViewSet(viewsets.ModelViewSet):
    queryset = Moneda.objects.all()
    serializer_class = MonedaSerializer
    permission_classes = [AllowAny]


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [AllowAny]


class PuestoViewSet(viewsets.ModelViewSet):
    queryset = Puesto.objects.all()
    serializer_class = PuestoSerializer
    permission_classes = [AllowAny]


class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleado.objects.all()
    serializer_class = EmpleadoSerializer
    permission_classes = [AllowAny]



class PresupuestoViewSet(viewsets.ModelViewSet):
    queryset = Presupuesto.objects.all()
    serializer_class = PresupuestoSerializer

    
class MetodoPagoViewSet(viewsets.ModelViewSet):
    queryset = MetodoPago.objects.all()
    serializer_class = MetodoPagoSerializer

    permission_classes = [AllowAny]
