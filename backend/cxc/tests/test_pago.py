from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from cxc.models import Pago, Cliente, Contrato, MetodoPago


class PagoCreationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass')
        self.client.force_authenticate(self.user)
        self.pago_url = reverse('pago-list')
        self.cliente = Cliente.objects.create(nombre_completo='Juan Pérez')
        self.contrato = Contrato.objects.create(cliente=self.cliente)
        self.metodo = MetodoPago.objects.create(nombre='Transferencia')

    def test_create_pago_with_contrato_and_metodo(self):
        data = {
            'concepto': 'PAGO',
            'monto_pagado': '100.00',
            'moneda_pagada': 'USD',
            'tipo_cambio': '17.50',
            'fecha_pago': '2025-01-01',
            'contrato': self.contrato.id,
            'metodo_pago': self.metodo.id,
        }
        response = self.client.post(self.pago_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Pago.objects.count(), 1)
        pago = Pago.objects.first()
        self.assertEqual(pago.contrato, self.contrato)
        self.assertEqual(pago.metodo_pago, self.metodo)
        self.assertEqual(float(pago.valor_mxn), 1750.0)
