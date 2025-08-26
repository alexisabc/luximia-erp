from decimal import Decimal
from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from cxc.models import (
    Moneda,
    Proyecto,
    UPE,
    Cliente,
    TipoCambio,
    FormaPago,
    Presupuesto,
    Contrato,
    Pago,
    MetodoPago,
)


class StrategicDashboardTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass", is_active=True
        )
        self.client.force_authenticate(self.user)
        self.url = "/api/cxc/dashboard/strategic/"

        moneda = Moneda.objects.create(codigo="MXN", nombre="Peso")
        proyecto = Proyecto.objects.create(nombre="Proyecto 1")
        upe1 = UPE.objects.create(
            proyecto=proyecto,
            identificador="U1",
            nivel=1,
            metros_cuadrados="100.00",
            estacionamientos=1,
            valor_total="1000.00",
            moneda=moneda,
        )
        upe2 = UPE.objects.create(
            proyecto=proyecto,
            identificador="U2",
            nivel=1,
            metros_cuadrados="100.00",
            estacionamientos=1,
            valor_total="2000.00",
            moneda=moneda,
        )
        cliente = Cliente.objects.create(
            nombre_completo="Cliente", email="cliente@example.com"
        )
        tipo_cambio = TipoCambio.objects.create(
            escenario="PACTADO", fecha=date(2024, 1, 1), valor="1.0"
        )
        forma_pago = FormaPago.objects.create(
            enganche=0, mensualidades=0, meses=0, contra_entrega=100
        )
        metodo_pago = MetodoPago.objects.create(nombre="EFECTIVO")

        # Contrato 1 - Enero
        pre1 = Presupuesto.objects.create(
            cliente=cliente,
            upe=upe1,
            moneda=moneda,
            tipo_cambio=tipo_cambio,
            forma_pago=forma_pago,
            precio_m2="100.00",
            precio_lista="100.00",
            descuento="0",
            precio_con_descuento="100.00",
            enganche="0",
            saldo="100.00",
        )
        contrato1 = Contrato.objects.create(
            presupuesto=pre1,
            moneda=moneda,
            tipo_cambio=Decimal("1.0"),
            monto_mxn="100.00",
            saldo="100.00",
        )
        contrato1.fecha = date(2024, 1, 5)
        contrato1.save(update_fields=["fecha"])

        Pago.objects.create(
            contrato=contrato1,
            tipo_pago="PAGO",
            fecha_pago=date(2024, 1, 10),
            fecha_ingreso=date(2024, 1, 10),
            metodo_pago=metodo_pago,
            monto="20.00",
            moneda=moneda,
            tipo_cambio=tipo_cambio,
            valor_mxn="20.00",
        )

        # Contrato 2 - Febrero
        pre2 = Presupuesto.objects.create(
            cliente=cliente,
            upe=upe2,
            moneda=moneda,
            tipo_cambio=tipo_cambio,
            forma_pago=forma_pago,
            precio_m2="200.00",
            precio_lista="200.00",
            descuento="0",
            precio_con_descuento="200.00",
            enganche="0",
            saldo="200.00",
        )
        contrato2 = Contrato.objects.create(
            presupuesto=pre2,
            moneda=moneda,
            tipo_cambio=Decimal("1.0"),
            monto_mxn="200.00",
            saldo="200.00",
        )
        contrato2.fecha = date(2024, 2, 15)
        contrato2.save(update_fields=["fecha"])

        Pago.objects.create(
            contrato=contrato2,
            tipo_pago="PAGO",
            fecha_pago=date(2024, 2, 20),
            fecha_ingreso=date(2024, 2, 20),
            metodo_pago=metodo_pago,
            monto="50.00",
            moneda=moneda,
            tipo_cambio=tipo_cambio,
            valor_mxn="50.00",
        )

    def test_programado_aggregation(self):
        response = self.client.get(self.url, {"timeframe": "year"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(Decimal(data["kpis"]["por_cobrar"]), Decimal("230"))

        labels = data["chart"]["labels"]
        programado = data["chart"]["programado"]
        recuperado = data["chart"]["recuperado"]

        self.assertEqual(labels, ["2024-01", "2024-02"])
        self.assertEqual(len(labels), len(programado))

        self.assertEqual(
            [Decimal(p) for p in programado],
            [Decimal("80"), Decimal("150")],
        )
        self.assertEqual(
            [Decimal(r) for r in recuperado],
            [Decimal("20"), Decimal("50")],
        )

